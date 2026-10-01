# API

The backend owns **everything that needs a secret or a model**: provider calls, prompts, model choice,
the "is this text at all?" guard, edit offsets, settings storage, usage logging and rate limiting. A
client is a thin caller that never holds a provider key.

- Code: [`api/`](../api) · Wire types: [`shared/contract.ts`](../shared/contract.ts)
- Layer rules (authoritative): [`.claude/rules/api-architecture.md`](../.claude/rules/api-architecture.md)

---

## 1. Responsibilities

| Owns | Does not own |
| --- | --- |
| Translation, language detection, grammar fix, error count, rewrite, transcription | When/how often a client asks (throttling, chunking, prefetching) |
| The guard: rejecting wrong-layout and gibberish text **before** any paid call | The local re-type of mistyped text (`switchLayout` is client-side) |
| Computing grammar-fix edits and their offsets (server-side diff) | Applying edits to a host document |
| Minting short-lived Realtime secrets for live dictation | Capturing audio, streaming it, assembling live text |
| User settings (`profiles.settings`) — source of truth | Settings defaults that need the OS (browser languages) |
| Per-user rate limit, request validation, CORS | History, stars, pinned languages, turned-off fields (client-local) |
| Persisting attempts for analytics (`translations`, `detections`, …) | Auth UI, token storage, token refresh |
| Health probe | |

---

## 2. Runtime and deployment

One Hono app, three entrypoints. Only entrypoints know which runtime they are on; `app.ts` must not branch on it.

| Entrypoint | Runtime | URL base | Auth gate |
| --- | --- | --- | --- |
| `api/src/index.ts` → `Deno.serve(app.fetch)` | Supabase Edge Function **`api`** (Deno) | `https://<ref>.supabase.co/functions/v1/api` · local `:54321` | Gateway `verify_jwt = true` |
| `api/dev/health.ts` | Edge Function **`health`** | `/functions/v1/health` | `verify_jwt = false` (public) |
| `api/src/server.ts` → `dev/dev-gateway.ts` | Local Node (`npm run dev:api`) | `http://127.0.0.1:8787/functions/v1/api` | Emulated (see §6) |

- `app` uses `basePath('/api')` because Supabase strips `/functions/v1` and passes `/api/...`.
- `api/src/**` deliberately lives outside `supabase/functions/`; `supabase/config.toml` points
  `entrypoint` / `import_map` at it (paths resolve from `supabase/`).
- Deno runs the TS directly: keep code **erasable** (no enums, no parameter properties).
- Runtime deps are in `api/deno.json` (import map); the same versions are `devDependencies` in
  `api/package.json` for vitest/tsc. Bump both.
- Two functions exist only because `verify_jwt` is per-function and enforced before the handler.
- ⚠ `[functions.health] entrypoint` points to `../api/src/health.ts`, but the file is `api/dev/health.ts`.

Commands (repo root): `npm run dev:api` (Node, no Docker) · `npm run db` (local Supabase) ·
`npm run dev:api:edge` (real gateway + Deno; run before deploying) · `npm run token -w api` (dev JWT) ·
deploy: `supabase link`, `supabase secrets set --env-file supabase/functions/.env`, `supabase functions deploy api`.

---

## 3. Internal architecture

Each layer calls only the one below it.

```
entrypoint        index.ts · server.ts · dev/health.ts      which runtime
  wiring          app.ts                                    CORS, route table, notFound
    middleware    middleware/{auth,rate-limit,body,guard}   401 · 429 · 400 · 422
      controller  controllers/*.ts                          one route's body + its HTTP response
        AI request   resources/aiClient/requests/*          one provider call: body in, result out
        repository   repositories/*.ts                      record ↔ columns, SQL, no-op without DB
          resource   resources/{db,logger}.ts, aiClient/client.ts   one connection per external thing
```

A route is one line in [`app.ts`](../api/src/app.ts), guards first:

```ts
app.post('/translate', requireUser('Sign in to translate'), rateLimit, validate(parseTranslateBody), guardText, translateController);
```

A provider controller always has the same shape: `requestId()` + `benchmark()` + `scopedLogger()`, a
`save()` closure wrapped in `waitUntil(...).catch(log)`, then
`try { call; log; save; c.json } catch { log; save; fail(502) }`. Saving never fails a request.

Shared utilities: [`utils/http.ts`](../api/src/utils/http.ts) — `fail()`, `waitUntil()`
(`EdgeRuntime.waitUntil`, keeps the isolate alive for the DB write), `requestId()` (uuid row id + 8-char
log id), `benchmark()`, `AppEnv`. Config is read only through `env()` ([`env.ts`](../api/src/env.ts)).

### Folder map

```
api/
  src/
    index.ts  server.ts  app.ts  env.ts
    middleware/   auth.ts (requireUser, userIdFrom) · rate-limit.ts · body.ts (validate + parse*) · guard.ts (guardText)
    controllers/  translate · detect · fix-grammar · check · rewrite · transcribe · voiceSession · settings · stats
    repositories/ translations · detections · corrections · rewrites · transcriptions · profiles · wordStats (file)
    resources/
      db.ts         postgres.js pool (max 1, prepare:false), checkDb()
      logger.ts     Logger interface, consoleLogger, scopedLogger(tag, id)
      aiClient/
        client.ts   OpenAI client, TypeSafeClient, MODEL / TRANSCRIBE_MODEL / LIVE_TRANSCRIBE_MODEL
        requests/   translate · detect · validateGuard · grammarQuality · rewrite · transcribe · voiceSession
                    fix-grammar/{fix-grammar.ts, utils/applyEdits, diff, tokenize, toEdits, editSegments, fromSegments, escapeHtml}
    utils/http.ts
  dev/            dev-gateway.ts · dev-jwt.ts · dev-token.ts · health.ts   (local only)
```

---

## 4. External services

| Service | Used for | Client / config |
| --- | --- | --- |
| **OpenAI Responses API** | `translate`, `fix-grammar` (streamed, `service_tier: 'priority'`, `reasoning: none`), `rewrite` — all with strict JSON schema output | `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-5.6-luna`) |
| **OpenAI Audio** | `/transcribe` (`audio.transcriptions.create`) | `OPENAI_TRANSCRIBE_MODEL` (default `gpt-4o-transcribe`) |
| **OpenAI Realtime** | `/voice-session` mints a client secret (120 s) for a `transcription` session: PCM 24 kHz, near-field noise reduction, **no turn detection** | `OPENAI_LIVE_TRANSCRIBE_MODEL` (default `gpt-live-transcribe`) |
| **TypeSafe** (`@typesafe-ai/sdk`, `systemOne` + `choice`) | Classification: the guard verdict, language detection, error count | `TYPESAFE_API_KEY` |
| **Postgres** (Supabase) | Attempt logs, profiles/settings | `SUPABASE_DB_URL` (injected) or `DATABASE_URL` override; none ⇒ saves are no-ops |
| **Supabase Gateway / GoTrue** | JWT verification before the handler; OAuth providers Google, Facebook | `supabase/config.toml`, root `.env` |

Provider choice is invisible to clients: responses carry `model` (what the provider reports it used)
and `usage`, nothing else provider-specific.

---

## 5. Endpoints

Base: `…/functions/v1/api`. All except `health` require `Authorization: Bearer <user access token>`.
Error body: `{ "error": { "message": string, "code": ApiErrorCode } }`.

### Summary

| Method & path | Guards (in order) | Body → Response | Saved to |
| --- | --- | --- | --- |
| `POST /detect` | user · rate · validate · **guard** | `DetectBody {text, url?}` → `DetectOk {lang, model?, usage?}` | `detections` (failures only, see §8) |
| `POST /translate` | user · rate · validate · **guard** (skipped if `sourceLang`) | `TranslateBody {text, targetLang, sourceLang?, url?}` → `TranslateOk {text, detectedSourceLang?, model?, usage?}` | `translations` (failures only); marks `detections.verified`; word stats |
| `POST /check` | user · rate · validate · (guard **in the same call**) | `CheckBody {text, url?}` → `CheckOk {errors 0..9, model?, usage?}` | — |
| `POST /fix-grammar` | user · rate · validate · (guard **in parallel**, skipped if `guarded`) | `FixGrammarBody {text, url?, guarded?}` → `FixGrammarOk {text, html, edits[], model?}` | `corrections` (disabled) |
| `POST /rewrite` | user · rate · validate · **guard** | `RewriteBody {text, url?, style}` → `RewriteOk {text, model?, usage?}` | `rewrites` (failures only) |
| `POST /transcribe` | user · rate · validate (multipart) | `audio` file (+ `url`) → `TranscribeOk {text, lang, model?}` | `transcriptions` (switched off) |
| `POST /voice-session` | user · rate | — → `VoiceSessionOk {secret, expiresAt, model}` | — |
| `GET /settings` | user | — → `Settings` | reads `profiles` |
| `PUT /settings` | user · validate | `Settings` (full object) → `Settings` | upserts `profiles.settings` |
| `GET /stats` | user | — → word / dictation counters | reads `api/word-stats.json` |
| `POST /stats/dictation` | user · validate | `DictationBody {seconds, words?, model?}` → 204 | `api/word-stats.json` |
| `GET /functions/v1/health` | none (separate function) | → `{ok, db: 'ok'\|'disabled'\|'down'}` 200 / 503 | — |

### Validation (`middleware/body.ts`)

- `text`: string, non-empty after trim, ≤ `MAX_TEXT_LENGTH` (5000). **Trimmed once here**, so guard,
  provider and the saved row (and its `trace_id`) see the same text.
- `url`: optional string ≤ 2048, stored, never parsed.
- `targetLang` / `sourceLang`: `LANGUAGE_CODE` `/^[a-zA-Z-]{2,8}$/` (not restricted to the 31 supported languages).
- `style`: one of `REWRITE_STYLES` (`natural`, `formal`).
- `guarded`: boolean; kept only when `true`.
- Settings: `favoriteLanguages` ≤ 20 valid codes; `disabledSites` ≤ 100 `HOSTNAME`s (≤ 253 chars).
- Audio: multipart, `audio` part of type `audio/*`, ≤ `MAX_AUDIO_BYTES` (5 MB).
- Dictation: `0 < seconds ≤ 600`, `words` integer 0..10 000, `model` `/^[\w.:-]{1,64}$/`.

### Errors

| Status | `code` | When |
| --- | --- | --- |
| 400 | `invalid-input` | Not JSON/multipart, or fails validation (message names the field) |
| 401 | `unauthenticated` | No valid user token. **The gateway's own 401 has a different body** (`{code, message}`), so clients must derive this from the status |
| 404 | `not-found` | Unknown route |
| 422 | `mistyped` | Guard: typed on the wrong keyboard layout |
| 422 | `gibberish` | Guard: random keystrokes, no language |
| 429 | `rate-limited` | > 60 provider requests / minute / user (per isolate) |
| 502 | `provider-failed` | Provider threw (message is route-specific) |

### Route details

**The guard** (`middleware/guard.ts` → `requests/validateGuard.ts`). A TypeSafe `choice`: `mistyped` |
`gibberish` | `text`. A verdict 422s before the paid call. **Fails open**: a guard outage lets the text
through. Skipped when the body carries `sourceLang` (it came from a `/detect` that already guarded the
same text) or `guarded: true` (a `/check` of the same text already answered). Saves 0.3–0.9 s per call.

**`POST /detect`** — TypeSafe `choice` over `LANGUAGES_MAP` (31 codes). `lang` may be `"und"`; clients
treat that as "no detection" and send no `sourceLang`.

**`POST /translate`** — OpenAI Responses with a translator prompt; input carries `Source language:`
(hint, not command) and `Target language:`. Strict schema `{text, detectedSourceLang}`. Keeps
`{{1}}`, `{{2}}` tokens (mentions/links) verbatim. When `sourceLang` is present, updates the user's
latest `detections` row for the same text: `verified = (lang = sourceLang)`. Adds source words to the
dev word counter (never fails the request).

**`POST /check`** — the cheap background call behind a badge. One TypeSafe call asks two questions:
the guard verdict and the error count (`"0".."9"`, 9 = "9 or more"). A verdict 422s. **Does not fail
open**: a failed call is 502. Not saved. Honours client cancellation (request signal).

**`POST /fix-grammar`** — the expensive call.
1. Guard runs **in parallel** with the fix (unless `guarded`); a verdict aborts the fix and 422s; a guard error lets it through.
2. The model returns only `edits: [{original, replacement, kind: 'error'|'native', reason}]`, never the whole text (output tokens = latency).
3. Streamed only to stop at `response.output_text.done` (`response.completed` trails by 0.1–2 s) ⇒ **no `usage`** in the response.
4. `applyEdits` rebuilds the corrected text (an `original` that can't be found is dropped).
5. `diff` (token-level LCS) of input vs corrected gives the real edit ranges; `toEdits` attaches the model's `kind`/`reason`. Whitespace-only insertions/deletions are widened to the next word so there is something to underline. **Offsets never come from the model.**
6. `fromSegments` builds `text` and escaped `html` (`<span class="fix" data-original="…">`), so user text cannot inject markup.

Response invariant: `edits[i].start/end` index into the **request** text; `text.slice(start,end) === original`;
`html`'s spans are the same edits in the same order.

**`POST /rewrite`** — OpenAI with a style instruction; strict schema `{text}`. No client UI.

**`POST /transcribe`** — multipart audio → OpenAI transcription (verbatim) → `detectLang` on the
text, returned together (`text: ''`, `lang: 'und'` when nothing was heard) so the client can skip
`/detect` and the guard. No guard (speech can't be mistyped).

**`POST /voice-session`** — mints a Realtime client secret (`expires_after` 120 s; the session
outlives it). The secret is never logged. Live models smooth grammar slightly; `/transcribe` is verbatim.

**`GET|PUT /settings`** — `profiles.settings` jsonb, merged over `DEFAULT_SETTINGS` on read (new
settings need no data migration). PUT **replaces the whole object** — clients must send the full
`Settings`. Not rate limited. With no DB, GET returns defaults and PUT echoes.

**`GET /stats`, `POST /stats/dictation`** — a **dev counter** in a JSON file
(`WORD_STATS_FILE`, default `api/word-stats.json`): translated words, dictation seconds/words, per
model, per UTC day. The edge has no writable disk, so in production it counts nothing (the write throws
and is logged; `/stats/dictation` still answers 204).

---

## 6. Authentication and authorisation

- **Production**: Supabase gateway verifies the JWT (`verify_jwt = true`) and rejects the publishable
  key before the handler runs. `userIdFrom()` (`middleware/auth.ts`) then **decodes without
  verifying** and requires `role === 'authenticated'` and a string `sub`. These two are coupled:
  turning off `verify_jwt` without adding verification makes `sub` forgeable.
- **Identity providers**: Google, Facebook (`[auth.external.*]` in `supabase/config.toml`; ids/secrets
  from root `.env`). Clients run OAuth against GoTrue themselves; the API never sees the OAuth flow.
- **Authorisation**: every row is scoped to `sub`; there are no roles and **no RLS** (the API is the
  only DB client and connects with a policy-bypassing role).
- **Local Node** (`dev/dev-gateway.ts`) emulates the gateway: `/functions/v1` prefixes, gateway-shaped
  401s, signature check via GoTrue JWKS (ES256/RS256) or HS256 (`npm run token`). **A request with no
  `Authorization` header runs as `DEV_USER_ID`** (seeded by `supabase/seed.sql`). `dev:api:edge` and
  production stay gated.

---

## 7. Cross-cutting

| Concern | Implementation | Ceiling |
| --- | --- | --- |
| Rate limit | `middleware/rate-limit.ts`: 60/min per user, in-memory `Map`, provider routes only | Per isolate: real limit = 60 × live isolates |
| CORS | `hono/cors`; `ALLOWED_ORIGINS` comma list, unset = reflect any origin (dev) | Set to `chrome-extension://<id>` (and other client origins) in prod |
| Logging | `scopedLogger(tag, id)` → `[translate ab12cd34] → / ← / ✗` lines; `resources/logger.ts` is the only `console` sink | Logs include request bodies (user text) |
| Cancellation | `c.req.raw.signal` is passed to `/check` and `/fix-grammar` provider calls, so a client abort stops billing | Not wired for translate/detect/rewrite |
| Persistence | Every save is `waitUntil(...)`, never awaited, never fails the request | Saves are lost if the isolate dies first |
| DB pool | postgres.js `max: 1, prepare: false` (one pool per isolate; pooler-friendly) | Raise if saves queue |

---

## 8. Data model (`supabase/migrations/`)

All attempt tables share a shape: `id uuid` (its first 8 chars are the log id), `created_at`,
`user_id → auth.users on delete set null`, `text`, `url`, `model`, token columns, `duration_ms`,
`error` (null on success), and a **generated** `trace_id = sha256(text)` (indexed) so every attempt on
the same text joins across tables without foreign keys.

| Table | Extra columns | Written by | Current state |
| --- | --- | --- | --- |
| `translations` | `target_lang`, `source_lang`, `result`, `detected_source_lang` | `/translate` | Failures only (success save commented out) |
| `detections` | `lang`, `verified` (null / true / false, written by `/translate`) | `/detect` | Failures only ⇒ `verified` is never set |
| `corrections` | `result` | `/fix-grammar` | Nothing (both saves commented out) |
| `rewrites` | `style`, `result` | `/rewrite` | Failures only |
| `transcriptions` | `mime_type`, `audio_bytes`, `lang` (never the audio) | `/transcribe` | Off (`SAVE_TRANSCRIPTIONS = false`) |
| `profiles` | `email`, `display_name`, `avatar_url`, `settings jsonb` | trigger `on_auth_user_created` + `PUT /settings` upsert | Active |

`auth.users` belongs to GoTrue and must not gain app columns; `profiles` is the app's user record.

---

## 9. Configuration

`supabase/functions/.env` (runtime secrets; pushed with `supabase secrets set`):

| Var | Default | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | — (required; `client.ts` throws without it) | OpenAI |
| `OPENAI_MODEL` | `gpt-5.6-luna` | translate, fix-grammar, rewrite |
| `OPENAI_TRANSCRIBE_MODEL` | `gpt-4o-transcribe` | `/transcribe` |
| `OPENAI_LIVE_TRANSCRIBE_MODEL` | `gpt-live-transcribe` | `/voice-session` |
| `TYPESAFE_API_KEY` | — | guard, detect, check |
| `ALLOWED_ORIGINS` | unset (any) | CORS allowlist |
| `DATABASE_URL` | unset | Override of injected `SUPABASE_DB_URL` |
| `WORD_STATS_FILE` | `api/word-stats.json` | Dev counter (Node only) |
| `DEV_USER_ID`, `DEV_JWT_SECRET` | seeded uuid / Supabase default | Local gateway emulation only |

Root `.env`: `SUPABASE_AUTH_EXTERNAL_{GOOGLE,FACEBOOK}_{CLIENT_ID,SECRET}`, substituted into
`config.toml` at `supabase start`. Redirect URLs for clients go in `[auth] additional_redirect_urls`.

---

## 10. Testing

Vitest, colocated `*.test.ts`. `app.test.ts` and `dev/dev-gateway.test.ts` mock every AI request,
`resources/db.ts` and the repositories **by module path**, so tests need no key, DB or network. A stale
mock path loads the real `client.ts`, which throws on the missing `OPENAI_API_KEY` and fails the file.
Pure helpers of fix-grammar each have a test beside them. Repositories are tested on their row mapping.

---

## 11. Client-facing coupling to remove when separating

Things in the API that exist for, or assume, the current extension:

- `url` everywhere is "the page the extension was used on" — a web-only concept. A native client would send an app id / nothing.
- `/stats` + `/stats/dictation` are dev telemetry backed by a local file — not a real API feature.
- Guard skipping trusts client flags (`sourceLang`, `guarded`) — fine, but it is an implicit protocol every client must follow to get the latency benefit.
- `fix-grammar` returns the same edits twice: `edits` (offsets, used for underlines and Replace) and `html` (escaped markup the extension's `GrammarPanel` parses back into React nodes; `core/fixEdits.ts` also rewrites and concatenates it). A native client would derive the view from `edits` alone; `html` is web-rendering convenience.
- `Settings` is shaped after the extension (`disabledSites` is a browser concept).
- CORS defaults assume a `chrome-extension://` origin.
- The 401 body mismatch (gateway vs app) is a Supabase artefact every client must handle by status.
