# AI Translator API

The translation backend for the extension, deployed as **Supabase Edge Functions**.
Wire types live in [`shared/contract.ts`](../shared/contract.ts).

Two functions: **`api`** requires a signed-in user (`verify_jwt = true`), **`health`** is public.
They are separate because `verify_jwt` is per-function and the gateway enforces it before the
handler runs — a liveness probe that needs a login is useless.

| Function | Local | Deployed |
|----------|-------|----------|
| `api` | `http://127.0.0.1:54321/functions/v1/api` | `https://<project-ref>.supabase.co/functions/v1/api` |
| `health` | `http://127.0.0.1:54321/functions/v1/health` | `https://<project-ref>.supabase.co/functions/v1/health` |

Supabase strips `/functions/v1` and hands the app paths that start with the function name, which is
why [`src/app.ts`](src/app.ts) is built with `basePath('/api')`. `app.ts` is wiring only — the guards
are middleware ([`src/middleware/`](src/middleware)) and the per-request work is a controller
([`src/controllers/`](src/controllers)). [`src/index.ts`](src/index.ts) is the
entrypoint; `supabase/config.toml` points at it from outside `supabase/functions/`, so this folder
keeps its normal npm-workspace layout for vitest and `tsc`.

## Running it

Three runtimes, one app. `src/index.ts` (edge) and `src/server.ts` (local Node) are the only
places that know which one they are on.

```bash
npm run dev:api        # local Node server on :8787, node --watch, no Docker needed
npm run db             # supabase start — local Postgres + edge runtime (needs Docker)
npm run dev:api:edge   # supabase functions serve — the real gateway and Deno runtime, on :54321
npm run token -w api   # mint a signed dev token for curl (optional user uuid)
```

`npm run dev:api` is the fast path; `src/dev-gateway.ts` stands in for the Supabase gateway there —
the `/functions/v1/...` prefixes, the gateway's own 401 bodies and a real signature check
(ES256/RS256 via the GoTrue JWKS endpoint, or HS256 for `npm run token` tokens). It is an
emulation and can drift, so **run `npm run dev:api:edge` before deploying**.

| Runtime | Base URL |
|---------|----------|
| Node (`dev:api`) | `http://127.0.0.1:8787/functions/v1/api` |
| Edge (`dev:api:edge`, `db`) | `http://127.0.0.1:54321/functions/v1/api` |

Deno runs the TypeScript directly — no build step — so keep the sources erasable: no enums, no
parameter properties.

The `curl` examples below assume:

```bash
BASE=http://127.0.0.1:8787/functions/v1/api   # or :54321 under dev:api:edge
TOKEN=$(npm run --silent token -w api)
```

## `GET /functions/v1/health`

Public. Checks the function and its database connection.

| Status | Body                              | When                                  |
|--------|-----------------------------------|---------------------------------------|
| 200    | `{ "ok": true, "db": "ok" }`       | Database reachable                    |
| 200    | `{ "ok": true, "db": "disabled" }` | No database URL set                   |
| 503    | `{ "ok": false, "db": "down" }`    | Database unreachable (5 s connect timeout) |

## `POST /translate`

**Requires `Authorization: Bearer <user access token>`.** The gateway verifies the signature and
rejects both anonymous requests and the publishable key; the handler then reads `sub` from the
claims and stores it as the row's `user_id`. See `userIdFrom()` in [`src/middleware/auth.ts`](src/middleware/auth.ts).

Request body (JSON):

| Field        | Type   | Required | Notes                                      |
|--------------|--------|----------|--------------------------------------------|
| `text`       | string | yes      | Non-empty, at most 5000 characters         |
| `targetLang` | string | yes      | Language code, 2–8 letters/dashes: `de`, `pt-BR` |
| `sourceLang` | string | no       | What the client believes the text is: the result of `POST /detect`, or the user's correction of it. Omit to let the provider auto-detect. Also decides `detections.verified` |
| `url`        | string | no       | Page the extension was used on, at most 2048 chars. Stored, never parsed. The extension's background worker fills it from the sender tab |

Response `200`:

```json
{
  "text": "[de] hello",
  "detectedSourceLang": "en",
  "model": "gpt-5.6-luna",
  "usage": { "inputTokens": 257, "outputTokens": 25, "totalTokens": 282 }
}
```

`detectedSourceLang`, `model` and `usage` are all optional — absent when the provider doesn't
report them. All three, plus `url`, are saved as columns on `translations`. `model` is what the
provider says it *used*, which may be a dated snapshot of whatever `OPENAI_MODEL` requested. Translation is done by OpenAI ([`src/translate.ts`](src/translate.ts)).

`trace_id` is a Postgres-generated `sha256` of `text`: every attempt on the same selection shares
one id, so `where trace_id = ...` finds the whole history of a translation and lets it be repeated.

```bash
curl -X POST $BASE/translate -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"text":"hello","targetLang":"de"}'
```

## `POST /detect`

Same auth, rate limit and error shape as `/translate`. Answers what language a selection is written
in, so the in-page menu can show it *before* a target language is picked. Detection is done by
OpenAI ([`src/detect.ts`](src/detect.ts)); both provider calls share the client in
[`src/openai.ts`](src/openai.ts).

| Field  | Type   | Required | Notes                                            |
|--------|--------|----------|--------------------------------------------------|
| `text` | string | yes      | Non-empty, at most 5000 characters               |
| `url`  | string | no       | As on `/translate`                               |

```bash
curl -X POST $BASE/detect -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"text":"Dzień dobry"}'
# {"lang":"pl","model":"gpt-5.6-luna","usage":{"inputTokens":161,"outputTokens":14,"totalTokens":175}}
```

`lang` is `"und"` when the provider cannot tell; the extension treats that as no detection and
sends no `sourceLang`.

Every attempt is saved to `detections` — a mirror of `translations` (same id, usage, error and
generated `trace_id` columns), so a detection and the translations of the same text join on
`trace_id` with no foreign key. One extra column, `verified`, records whether the detection was
right — and it is written by `POST /translate`, not by the detection itself:

| `verified` | Meaning                                                                     |
|------------|-----------------------------------------------------------------------------|
| `null`     | No feedback yet — the menu was closed without translating                     |
| `true`     | The user translated with it (`sourceLang` equals the detected `lang`)         |
| `false`    | The user overrode it (`sourceLang` differs) — the detection was wrong         |

Only the user's most recent detection of that exact text is marked, and the update never fails or
delays the translation.

Note that opening the menu now costs two requests against the per-user rate limit, not one.

## `GET /settings` and `PUT /settings`

Both require the same `Authorization: Bearer` as `/translate`, and act on the caller's own row.

```bash
curl -s $BASE/settings -H "Authorization: Bearer $TOKEN"
# {"favoriteLanguages":["en","pl"]}

curl -s -X PUT $BASE/settings -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"favoriteLanguages":["de","uk","pl"]}'
```

Stored on `profiles.settings` (jsonb) and merged over the defaults in
[`shared/contract.ts`](../shared/contract.ts) on read, so adding a setting needs no data migration.
`favoriteLanguages` must be an array of at most 20 valid language codes.

## Errors

Every error has the same shape:

```json
{ "error": { "message": "text is required", "code": "invalid-input" } }
```

| Status | `code`            | When                                         |
|--------|-------------------|----------------------------------------------|
| 400    | `invalid-input`   | Body isn't JSON or fails validation          |
| 401    | `unauthenticated` | No user token, or a token that isn't a signed-in user |
| 404    | `not-found`       | Unknown route                                |
| 429    | `rate-limited`    | More than 60 requests per minute from one user |
| 502    | `provider-failed` | The provider threw (translation or detection) |

A 401 raised by the **gateway** (missing or malformed header) never reaches the handler, so its
body is Supabase's `{code, message}` rather than the shape above. `extension/src/api.ts` derives
`unauthenticated` from the status for exactly this reason.

The rate limit is 60/min per **user**, kept in an in-memory `Map`, so each isolate has its own:
the real ceiling is 60/min × live instances.

## Migrations

Owned by the Supabase CLI — SQL files live in [`supabase/migrations/`](../supabase/migrations/).

```bash
npx supabase migration new <name>   # create the next file
npx supabase migration up           # apply locally
npx supabase db push                # apply to the linked project
```

## Dependencies

Two lists, on purpose. [`deno.json`](deno.json) is the **runtime** import map — Supabase Edge
Functions have no `package.json` support. The same packages sit in `devDependencies` so vitest and
`tsc` resolve the same bare specifiers from `node_modules`. Bump both together.

## OAuth providers

Google and Facebook are enabled in `supabase/config.toml`. Each provider console needs the callback
URL `http://127.0.0.1:54321/auth/v1/callback` locally and
`https://<project-ref>.supabase.co/auth/v1/callback` once deployed; ids and secrets go in the
git-ignored **root `.env`** (template: [`.env.example`](../.env.example)), which the CLI substitutes
into `config.toml` at `supabase start`.

The extension's redirect target is `https://<extension-id>.chromiumapp.org/` and must be listed in
`[auth] additional_redirect_urls`. That means pinning the extension id with `key` in
`extension/wxt.config.ts` — an unpacked dev load otherwise derives its id from the folder path, and
sign-in fails with a redirect mismatch that reads like a provider misconfiguration.

Adding a provider is a `[auth.external.<name>]` block plus an entry in
`extension/src/auth/providers.ts`.

## Configuration

Put these in `supabase/functions/.env` (git-ignored; start from
[`.env.example`](../supabase/functions/.env.example)). `supabase start` and
`supabase functions serve --env-file` load it locally; `supabase secrets set --env-file
supabase/functions/.env` pushes it to the deployed function.

| Env var           | Default | Meaning                                                                 |
|-------------------|---------|-------------------------------------------------------------------------|
| `OPENAI_API_KEY`  | —       | Required. The provider call fails without it                            |
| `OPENAI_MODEL`    | `gpt-5.6-luna` | Model used for translation and detection                         |
| `ALLOWED_ORIGINS` | unset   | Comma-separated CORS allowlist, e.g. `chrome-extension://<id>`. Unset allows any origin (dev only) |
| `DATABASE_URL`    | unset   | Override only. Supabase injects `SUPABASE_DB_URL` both locally and in a deployed function, so translations and detections — failures included — are saved without any setting |

`verify_jwt = true` in `supabase/config.toml` is the gate: only a signed-in user reaches the
handler. The rate limit above and an OpenAI spend cap bound what one account can spend; set
`ALLOWED_ORIGINS` once the extension id is known.
