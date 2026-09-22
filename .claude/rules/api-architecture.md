# API architecture (`api/src/`)

Layered, outermost first. **Each layer may only call the one below it.**

| Layer | Files | Owns | Must not |
| --- | --- | --- | --- |
| entrypoint | `index.ts`, `server.ts`, `health.ts` | which runtime we are on | anything else |
| wiring | `app.ts` | CORS, the route table, `notFound` | branch on runtime, do work |
| middleware | `middleware/*` | `requireUser` (401), `rateLimit` (429), `validate(parse…)` (400) | touch the DB or a provider |
| controller | `controllers/*` | the whole per-route body: which service, which repository, which messages, and its own response | build SQL, call OpenAI directly |
| service | `translate.ts`, `detect.ts` | one provider call: body in, result out | log, save, know about HTTP |
| repository | `repositories/*` | app record ↔ column mapping, the SQL, the `if (!sql) return` no-op | log, decide HTTP status, call a service |
| connection | `db.ts` | the single `sql` pool and `checkDb()` | know about any table |

`http.ts` is the one thing every layer shares: `fail()`, `waitUntil()`, `requestId()`, `benchmark()`,
the `AppEnv` context type. `logger.ts` is the log sink behind the `Logger` interface, plus
`scopedLogger(tag, id)` for the `[tag id]` prefix.

## Rules

- **Only controllers call repositories.** Middleware and services never import `repositories/*`.
  The single exception is `health.ts` → `checkDb()`, a liveness probe rather than a request.
- **Only repositories import `db.ts`** (plus `health.ts` for `checkDb`). A controller that needs a
  new table gets a new file under `repositories/`, never an inline `sql` template.
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
  deployed, it belongs in an entrypoint or in `dev-gateway.ts`.
- **`userIdFrom()` in `middleware/auth.ts` decodes but does not verify** the JWT: the gateway
  already checked the signature (`[functions.api] verify_jwt = true`) and rejects the publishable
  key. Setting `verify_jwt = false` without adding signature verification makes `sub` forgeable.
- **Validation happens once, at the boundary.** Controllers read `c.get('body') as …` and trust
  it; the route table pairs the parser with its controller on the same line. Nothing re-validates
  downstream.
- **A controller owns its own response.** Nothing shared may call `c.json()` or `fail()` on its
  behalf — a helper returns data, the controller decides the HTTP. The two provider routes
  therefore repeat the same shape, and that repetition is deliberate: the whole route reads top to
  bottom in one file, with nothing reaching into the context behind it.
- **Shared pieces are single-job and composed by the controller**, never bundled into one call:
  `requestId()` for the row/log id pair, `benchmark()` for the timing, `scopedLogger(tag, id)` for
  the `→ ← ✗` lines. A provider route reads: ids and stopwatch, a `save()` closure, then
  `try { call; log; save; c.json } catch { log; save; fail(502) }`.
- **Log through `Logger`, not `console`.** Controllers take a `scopedLogger`; only `logger.ts`
  names `console`, so the sink can be swapped in one place.

## Where new code goes

| Adding… | Touch |
| --- | --- |
| a route | `controllers/<name>.ts` + one line in `app.ts`; a provider route composes `requestId()`, `benchmark()` and `scopedLogger()` itself |
| a request-shape check | a `parse…` in `middleware/body.ts`, wired with `validate(...)` |
| a cross-cutting guard | `middleware/<name>.ts`, applied per route in `app.ts` — not inside a controller |
| a provider call | a service file at `src/`, body in / result out, no logging or saving |
| a table | a migration in `supabase/migrations/` + `repositories/<table>.ts` |
| a runtime difference | an entrypoint or `dev-gateway.ts` |

## Constraints that outrank tidiness

- Keep API code **erasable**: no enums, no parameter properties. Deno runs the TS directly, with
  no build step.
- Tests mock by module path (`vi.mock('./translate.ts')`, `./repositories/*`). Moving a service or
  repository file is a test edit — weigh it before doing it for looks.
- Error bodies are `{error:{message, code}}`; codes stay in sync with `shared/contract.ts`. A
  gateway 401 arrives in a *different* shape (`{code, message}`), which is why the extension reads
  401 from the status, not the body.
