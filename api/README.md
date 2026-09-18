# AI Translator API

Small HTTP API that does the translation for the extension. Base URL for local runs: `http://127.0.0.1:8787`.

Run it with `./start-api.sh` from the repo root (Docker) or `npm run dev -w api` (Node 24). Wire types live in [`shared/contract.ts`](../shared/contract.ts).

## `GET /health`

Checks the API and its database connection.

| Status | Body                              | When                                  |
|--------|-----------------------------------|---------------------------------------|
| 200    | `{ "ok": true, "db": "ok" }`       | Database reachable                    |
| 200    | `{ "ok": true, "db": "disabled" }` | `DATABASE_URL` not set                |
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

`detectedSourceLang` is optional. Translation is done by OpenAI (`api/src/translate.ts`).

Example:

```bash
curl -X POST http://127.0.0.1:8787/translate \
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

## Migrations

SQL files in [`migrations/`](migrations/) run in name order, once each, each in its own transaction. Applied names are recorded in `schema_migrations`. Add a change as the next numbered file (`002_….sql`); never edit one that has already been applied.

```bash
npm run migrate -w api                                    # from the host, uses api/.env
docker compose run --rm api node api/src/migrate.ts       # or inside the API image
```

A failing migration rolls back and the command exits non-zero; later files are not run.

## Configuration

Put these in `api/.env` (git-ignored; start from [`.env.example`](.env.example)). `npm run dev -w api` loads it with dotenv, and `docker compose` / `./start-api.sh` pass it to the container at runtime.

| Env var           | Default | Meaning                                                                 |
|-------------------|---------|-------------------------------------------------------------------------|
| `OPENAI_API_KEY`  | —       | Required. The API fails to start without it                             |
| `DATABASE_URL`    | unset   | Postgres (Supabase session-pooler) URL. Every translation, including failures, is saved to the `translations` table (create it with `npm run migrate -w api`). Unset = nothing is saved |
| `OPENAI_MODEL`    | `gpt-5.6-luna` | Model used for translation                                       |
| `PORT`            | `8787`  | Listen port                                                             |
| `ALLOWED_ORIGINS` | unset   | Comma-separated CORS allowlist, e.g. `chrome-extension://<id>`. Unset allows any origin (dev only). |

The rate limit is kept in memory, so it resets on restart and isn't shared between instances. The client IP comes from `x-forwarded-for`; requests without that header share one bucket.
