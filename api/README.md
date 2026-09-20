# AI Translator API

The translation backend for the extension, deployed as a single **Supabase Edge Function** named `api`.
Wire types live in [`shared/contract.ts`](../shared/contract.ts).

Two functions: **`api`** requires a signed-in user (`verify_jwt = true`), **`health`** is public.
They are separate because `verify_jwt` is per-function and the gateway enforces it before the
handler runs — a liveness probe that needs a login is useless.

| Function | Local | Deployed |
|----------|-------|----------|
| `api` | `http://127.0.0.1:54321/functions/v1/api` | `https://<project-ref>.supabase.co/functions/v1/api` |
| `health` | `http://127.0.0.1:54321/functions/v1/health` | `https://<project-ref>.supabase.co/functions/v1/health` |

Supabase strips `/functions/v1` and hands the app paths that start with the function name, which is
why [`src/app.ts`](src/app.ts) is built with `basePath('/api')`. [`src/index.ts`](src/index.ts) is the
entrypoint; `supabase/config.toml` points at it from outside `supabase/functions/`, so this folder
keeps its normal npm-workspace layout for vitest and `tsc`.

## Running it

```bash
npm run db          # supabase start — local Postgres + edge runtime (needs Docker)
npm run dev:api     # supabase functions serve api --env-file supabase/functions/.env
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
claims and stores it as the row's `user_id`. See `userIdFrom()` in [`src/app.ts`](src/app.ts).

Request body (JSON):

| Field        | Type   | Required | Notes                                      |
|--------------|--------|----------|--------------------------------------------|
| `text`       | string | yes      | Non-empty, at most 5000 characters         |
| `targetLang` | string | yes      | Language code, 2–8 letters/dashes: `de`, `pt-BR` |
| `sourceLang` | string | no       | Omit to let the provider auto-detect       |
| `url`        | string | no       | Page the extension was used on, at most 2048 chars. Stored, never parsed. The extension's background worker fills it from the sender tab |

Response `200`:

```json
{
  "text": "[de] hello",
  "detectedSourceLang": "en",
  "usage": { "inputTokens": 257, "outputTokens": 25, "totalTokens": 282 }
}
```

`detectedSourceLang` and `usage` are both optional — `usage` is absent when the provider
doesn't report it. Both, plus `url`, are saved as columns on `translations`. Translation is done by OpenAI ([`src/translate.ts`](src/translate.ts)).

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/api/translate \
  -H 'content-type: application/json' \
  -d '{"text":"hello","targetLang":"de"}'
```

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
| 429    | `rate-limited`    | More than 60 requests per minute from one IP |
| 502    | `provider-failed` | The translation provider threw               |

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
| `OPENAI_MODEL`    | `gpt-5.6-luna` | Model used for translation                                       |
| `ALLOWED_ORIGINS` | unset   | Comma-separated CORS allowlist, e.g. `chrome-extension://<id>`. Unset allows any origin (dev only) |
| `DATABASE_URL`    | unset   | Override only. Supabase injects `SUPABASE_DB_URL` both locally and in a deployed function, so translations — failures included — are saved to `translations` without any setting |

`verify_jwt = false` in `supabase/config.toml`: the extension carries no Supabase key, so the
endpoint is public. The rate limit above and an OpenAI spend cap are what bound the damage; set
`ALLOWED_ORIGINS` once the extension id is known.
