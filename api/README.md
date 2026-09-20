# AI Translator API

The translation backend for the extension, deployed as a single **Supabase Edge Function** named `api`.
Wire types live in [`shared/contract.ts`](../shared/contract.ts).

| Where | Base URL |
|-------|----------|
| Local | `http://127.0.0.1:54321/functions/v1/api` |
| Deployed | `https://<project-ref>.supabase.co/functions/v1/api` |

Supabase strips `/functions/v1` and hands the app paths that start with the function name, which is
why [`src/app.ts`](src/app.ts) is built with `basePath('/api')`. [`src/index.ts`](src/index.ts) is the
entrypoint; `supabase/config.toml` points at it from outside `supabase/functions/`, so this folder
keeps its normal npm-workspace layout for vitest and `tsc`.

## Running it

```bash
npm run db          # supabase start — local Postgres + edge runtime (needs Docker)
npm run dev:api     # supabase functions serve api --env-file supabase/functions/.env
```

## `GET /health`

Checks the function and its database connection.

| Status | Body                              | When                                  |
|--------|-----------------------------------|---------------------------------------|
| 200    | `{ "ok": true, "db": "ok" }`       | Database reachable                    |
| 200    | `{ "ok": true, "db": "disabled" }` | No database URL set                   |
| 503    | `{ "ok": false, "db": "down" }`    | Database unreachable (5 s connect timeout) |

## `POST /translate`

Request body (JSON):

| Field        | Type   | Required | Notes                                      |
|--------------|--------|----------|--------------------------------------------|
| `text`       | string | yes      | Non-empty, at most 5000 characters         |
| `targetLang` | string | yes      | Language code, 2–8 letters/dashes: `de`, `pt-BR` |
| `sourceLang` | string | no       | Omit to let the provider auto-detect       |

Response `200`:

```json
{ "text": "[de] hello", "detectedSourceLang": "en" }
```

`detectedSourceLang` is optional. Translation is done by OpenAI ([`src/translate.ts`](src/translate.ts)).

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
| 404    | `not-found`       | Unknown route                                |
| 429    | `rate-limited`    | More than 60 requests per minute from one IP |
| 502    | `provider-failed` | The translation provider threw               |

The rate limit is an in-memory `Map`, so each isolate has its own: the real ceiling is 60/min ×
live instances. The client IP comes from `x-forwarded-for`; requests without that header share one
bucket.

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
