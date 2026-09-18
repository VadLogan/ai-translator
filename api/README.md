# AI Translator API

Small HTTP API that does the translation for the extension. Base URL for local runs: `http://127.0.0.1:8787`.

Run it with `./start-api.sh` from the repo root (Docker) or `npm run dev -w api` (Node 24). Wire types live in [`shared/contract.ts`](../shared/contract.ts).

## `GET /health`

Liveness check.

```json
{ "ok": true }
```

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

`detectedSourceLang` is optional. The current provider is a stub that returns `[<targetLang>] <text>`.

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

## Configuration

| Env var           | Default | Meaning                                                                 |
|-------------------|---------|-------------------------------------------------------------------------|
| `PORT`            | `8787`  | Listen port                                                             |
| `ALLOWED_ORIGINS` | unset   | Comma-separated CORS allowlist, e.g. `chrome-extension://<id>`. Unset allows any origin (dev only). |

The rate limit is kept in memory, so it resets on restart and isn't shared between instances. The client IP comes from `x-forwarded-for`; requests without that header share one bucket.
