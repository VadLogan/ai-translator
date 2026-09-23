# API architecture (`api/`)

Layered, outermost first. **Each layer may only call the one below it.**

| Layer | Files | Owns | Must not |
| --- | --- | --- | --- |
| entrypoint | `src/index.ts`, `src/health.ts`, `src/server.ts` | which runtime we are on | anything else |
| wiring | `src/app.ts` | CORS, the route table, `notFound` | branch on runtime, do work |
| middleware | `src/middleware/*` | `requireUser` (401), `rateLimit` (429), `validate(parse…)` (400) | touch the DB or a provider |
| controller | `src/controllers/*` | the whole per-route body: which request, which repository, which messages, and its own response | build SQL, call OpenAI directly |
| AI request | `src/resources/aiClient/requests/*` | one provider call: body in, result out | log, save, know about HTTP |
| repository | `src/repositories/*` | app record ↔ column mapping, the SQL, the `if (!sql) return` no-op | log, decide HTTP status, call an AI request |
| resource | `src/resources/db.ts`, `src/resources/aiClient/client.ts`, `src/resources/logger.ts` | the one connection per external thing: the `sql` pool + `checkDb()`, the OpenAI `client` + `MODEL`, the log sink | know about any table, route or prompt |

## Folders

```
api/
  src/                  everything that ships (the edge bundle starts at src/index.ts and src/health.ts)
    index.ts            edge entry: Deno.serve(app.fetch)
    health.ts           edge entry: public liveness probe, its own function
    server.ts           local Node entry: serves dev/dev-gateway.ts
    app.ts              route table
    env.ts              env() — Deno.env deployed, process.env under Node/vitest
    middleware/         guards
    controllers/        one file per route group
    repositories/       one file per table, test beside it
    resources/
      db.ts             the sql pool, checkDb()
      logger.ts         Logger interface, consoleLogger, scopedLogger(tag, id)
      aiClient/
        client.ts       the OpenAI client and MODEL, read once
        requests/       one file per provider call (translate, detect, rewrite)
          <name>/       a folder only when the call has its own helpers (fix-grammar/utils/*)
    utils/http.ts       fail(), waitUntil(), requestId(), benchmark(), AppEnv
  dev/                  local-only, never deployed: dev-gateway.ts, dev-jwt.ts, dev-token.ts
```

`dev/` is for things that exist *only* to run locally. `server.ts` imports from it; nothing under
`src/` besides `server.ts` may. A deployed entrypoint (`health.ts`) is not dev code even though it is
tiny — it lives in `src/`, where `[functions.health]` in `supabase/config.toml` points.

`utils/http.ts` is the one thing every layer shares. `resources/logger.ts` is the log sink behind the
`Logger` interface; only it names `console`.

## Rules

- **Only controllers call repositories.** Middleware and AI requests never import `repositories/*`.
  The single exception is `health.ts` → `checkDb()`, a liveness probe rather than a request.
- **Only repositories import `resources/db.ts`** (plus `health.ts` for `checkDb`). A controller that
  needs a new table gets a new file under `repositories/`, never an inline `sql` template.
- **Only AI requests import `resources/aiClient/client.ts`.** A controller imports the request
  function, never the `client`.
- **Repositories no-op when `sql` is null.** That guard lives in the repository, not the caller —
  it is what lets vitest and a keyless local run work.
- **Saving never fails the request.** `waitUntil(...)` plus `.catch((dbError) => log.error(...))`
  stay in the controller, because the line they log carries the controller's request id.
  Repositories just throw.
- **A route is a sentence in `app.ts`**, guards first:
  ```ts
  app.post('/translate', requireUser('Sign in to translate'), rateLimit, validate(parseTranslateBody), translateController);
  ```
  `rateLimit` counts per user id, so it must come after `requireUser`, and it goes on the provider
  routes only — never on `/settings`.
- **`app.ts` never branches on the runtime.** If something differs between edge, local Node and
  deployed, it belongs in an entrypoint or in `dev/dev-gateway.ts`.
- **`userIdFrom()` in `middleware/auth.ts` decodes but does not verify** the JWT: the gateway
  already checked the signature (`[functions.api] verify_jwt = true`) and rejects the publishable
  key. Setting `verify_jwt = false` without adding signature verification makes `sub` forgeable.
- **Validation happens once, at the boundary.** Controllers read `c.get('body') as …` and trust
  it; the route table pairs the parser with its controller on the same line. Nothing re-validates
  downstream.
- **A controller owns its own response.** Nothing shared may call `c.json()` or `fail()` on its
  behalf — a helper returns data, the controller decides the HTTP. The provider routes therefore
  repeat the same shape, and that repetition is deliberate: the whole route reads top to bottom in
  one file, with nothing reaching into the context behind it.
- **Shared pieces are single-job and composed by the controller**, never bundled into one call:
  `requestId()` for the row/log id pair, `benchmark()` for the timing, `scopedLogger(tag, id)` for
  the `→ ← ✗` lines. A provider route reads: ids and stopwatch, a `save()` closure, then
  `try { call; log; save; c.json } catch { log; save; fail(502) }`.
- **Log through `Logger`, not `console`.** Controllers take a `scopedLogger`; only
  `resources/logger.ts` names `console` (entrypoints' one-line startup banner aside), so the sink
  can be swapped in one place.
- **Pure helpers of one AI request stay beside it** in `requests/<name>/utils/`, one function per
  file with its test next to it (`diff.ts` + `diff.test.ts`). Promote one to `src/utils/` only when
  a second caller appears.

## Where new code goes

| Adding… | Touch |
| --- | --- |
| a route | `controllers/<name>.ts` + one line in `app.ts`; a provider route composes `requestId()`, `benchmark()` and `scopedLogger()` itself |
| a request-shape check | a `parse…` in `middleware/body.ts`, wired with `validate(...)` |
| a cross-cutting guard | `middleware/<name>.ts`, applied per route in `app.ts` — not inside a controller |
| a provider call | `resources/aiClient/requests/<name>.ts`, body in / result out, using `client` + `MODEL`; no logging or saving |
| a helper for one provider call | `resources/aiClient/requests/<name>/utils/<helper>.ts` + its test |
| a table | a migration in `supabase/migrations/` + `repositories/<table>.ts` + its test |
| a new external connection | `resources/<name>.ts`, read once at module load |
| a runtime difference | an entrypoint or `dev/dev-gateway.ts` |
| a local-only tool | `dev/`, plus an `npm` script and a `tsconfig.json` `include` entry |

## Constraints that outrank tidiness

- Keep API code **erasable**: no enums, no parameter properties. Deno runs the TS directly, with
  no build step.
- Tests mock by module path, relative to the test file (`vi.mock('./resources/aiClient/requests/translate.ts')`,
  `./repositories/*`, `./resources/db.ts`). Moving a request, repository or resource file is a test
  edit — and a stale path fails *silently*: the real module loads, and `client.ts` throws on the
  missing `OPENAI_API_KEY`. Weigh a move before doing it for looks.
- A moved entrypoint is also a `supabase/config.toml` edit (`entrypoint` resolves from
  `supabase/`, not the repo root) and a `package.json` script edit.
- Error bodies are `{error:{message, code}}`; codes stay in sync with `shared/contract.ts`. A
  gateway 401 arrives in a *different* shape (`{code, message}`), which is why the extension reads
  401 from the status, not the body.
