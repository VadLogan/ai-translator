# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

npm workspaces monorepo with two parts: `extension/` (Chrome MV3 frontend, WXT + TypeScript) and `api/` (Hono backend that owns translation, deployed as a single Supabase Edge Function), plus `shared/contract.ts` for the wire types both import. The user selects text in an input, textarea, or contenteditable field. A floating icon appears; clicking it opens a menu of favorite languages, and picking one replaces the selection with the translation fetched from the API.

**The extension is frontend only**: detect the selection, show the icon and menu, call `POST /translate`, and apply the result. It has no provider abstraction, provider choice, or provider config. Translation and provider selection live in the API (`api/src/translate.ts`), because a provider key shipped in the extension is public.

## Commands

Root commands fan out to both workspaces (`npm test`, `npm run compile`, `npm run build`); `-w extension` / `-w api` targets one.

- `npm run db` (root): `supabase start` — local Postgres + edge runtime, needs Docker. Everything else assumes it is running.
- `npm run dev` (root): API + extension dev browser + playground together
- `npm run dev:playground -w extension`: extension + `playground/` on http://127.0.0.1:5555 (opened via `webExt.startUrls` in `extension/wxt.config.ts`); the manual test environment
- `npm run dev:api` (root): `supabase functions serve api --env-file supabase/functions/.env`, on http://127.0.0.1:54321/functions/v1/api. Deno runs the TS directly — no build step, so keep API code erasable: no enums, no parameter properties.
- `npx supabase migration new <name>`, then `npx supabase migration up` (local) / `npx supabase db push` (linked project). Files live in `supabase/migrations/`; don't edit applied ones.
- Deploy the API: `npx supabase link --project-ref <ref>`, `npx supabase secrets set --env-file supabase/functions/.env`, `npx supabase functions deploy api`.
- `npm run build`: production build into `extension/output/chrome-mv3`. Load it unpacked from `chrome://extensions`.
- `npm run compile`: type check. The extension needs the generated `.wxt/` types; run `npx wxt prepare` in `extension/` on a fresh checkout or after adding entrypoints.
- `npm test`: all unit tests (Vitest), both workspaces
- `npm run deploy`: compile + test + zip + `wxt submit` to the Chrome Web Store. Credentials live in the git-ignored `.env.submit`, created by `npx wxt submit init`. Bump `package.json` version first, because the manifest version comes from it. `npm run deploy:check` is a dry run.
- Single test file: `npx vitest run src/api.test.ts` from inside `extension/` or `api/`. Single test by name: `npx vitest run -t "surfaces the API error message"`.

There is no linter configured. `playground/index.html` has one of each field type.

## Architecture

`srcDir` is `src`, so WXT entrypoints live in `src/entrypoints/` (`background.ts`, `content.ts`, `options/`). Import WXT APIs explicitly from subpaths (`wxt/browser`, `wxt/utils/storage`, `wxt/utils/define-background`, …) instead of relying on auto-imports.

Extension layout:
- `src/api.ts` has `translate()`, the one `fetch` to `POST /translate`. The base URL comes from `WXT_API_URL`, falling back to `http://127.0.0.1:54321/functions/v1/api`, and its origin must be in `host_permissions` (`wxt.config.ts` lists the local stack and `https://<project-ref>.supabase.co`; keep the two in sync by hand). API error bodies become a plain `Error` carrying the API's message.
- `src/entrypoints/background.ts` handles messages and calls `translate()`. The page url is read from the `onMessage` `sender`, not the message body, so a compromised page can't forge it — that is why `handle()` takes the sender.
- `src/settings/` stores only `favoriteLanguages` in `chrome.storage`; the options page edits it.
- `src/core/languages.ts` is the static language list.

**API** (`api/`): one Supabase Edge Function named `api`. `app.ts` is the Hono app (routes, CORS, in-memory rate limit, boundary validation); `translate.ts` is only the provider call (OpenAI): `TranslateBody` in, `TranslateOk` out, no logging or saving. The `POST /translate` handler in `app.ts` owns the request id, timing, `→ ← ✗` log lines, and saving via the repository. `index.ts` only calls `Deno.serve(app.fetch)`, so tests hit `app.request()` with no port. Error bodies are `{error:{message, code}}` and `src/api.ts` surfaces the message; keep the codes in sync with `shared/contract.ts`. `repositories/translations.ts` (`translationsRepository`, mapping app records to columns) saves every translation, failures included, to the Postgres table `translations` (created by `supabase/migrations/`); a row's id starts with the request's log id. A row also records `url` (the page the extension was used on) and the provider's `input_tokens` / `output_tokens` / `total_tokens`; all four are nullable, since failures report no usage and non-extension callers send no url. `db.ts` only holds the shared connection and `checkDb()`. New tables get their own repository file. The save never fails a translation.

API rules:
- `api/src/**` deliberately stays outside `supabase/functions/`. `[functions.api]` in `supabase/config.toml` points `entrypoint`/`import_map` at it from the project root, which keeps the npm workspace layout for vitest and `tsc`. Don't move the sources.
- `app` is built with `basePath('/api')` because Supabase strips `/functions/v1` and hands the app paths starting with the function name. The basePath and the function name must match; tests request `/api/translate`.
- Read config through `env()` in `env.ts` (Deno.env when deployed, `process.env` under vitest), never `process.env` directly. Supabase has secrets at module load, so module-level reads are fine.
- The DB save is wrapped in `waitUntil()` (`EdgeRuntime.waitUntil`), which keeps the isolate alive until the insert lands. Without it the row is lost the moment the response returns. It is a no-op under vitest.
- Runtime deps are declared in `api/deno.json` (Edge Functions have no `package.json` support); the same packages sit in `api/package.json` `devDependencies` only so vitest and `tsc` resolve them. Bump both together.
- Secrets live in git-ignored `supabase/functions/.env` (template: `.env.example` beside it), loaded by `supabase start` / `--env-file` and pushed with `supabase secrets set --env-file`.
- `verify_jwt = false`: the endpoint is public because the extension holds no Supabase key. The rate limit and an OpenAI spend cap are the abuse ceiling; set `ALLOWED_ORIGINS` once the extension id is known.
- No `DATABASE_URL` in production — Supabase injects `SUPABASE_DB_URL`; `db.ts` prefers `DATABASE_URL` as an override. postgres.js runs `max: 1, prepare: false` because each isolate gets its own pool.
- `app.test.ts` mocks `translate.ts`, `db.ts` and the repository, so API tests need no key, DB or network. Mock any new module that opens a connection when it loads.
- `GET /health` returns 503 only when a DB URL is set and `select 1` fails (5 s connect timeout); `db: "disabled"` is still 200.

**Runtime flow**: The content script and the options page talk to the background worker only through the typed protocol in `src/messaging/messages.ts` (`translate`, `open-options`). Responses are `{ ok, data } | { ok: false, error }`, because `Error` objects don't survive messaging. When adding a message type, update both `Message` and `ResponseMap`. The API call must stay in the background worker: `host_permissions` exempt it from page CORS, and on HTTPS pages a content-script fetch to an `http://` API would be blocked as mixed content.

**Content script** (`src/entrypoints/content.ts` + `src/content/`):
- `selection.ts` snapshots the selection when the icon appears: offsets for text controls, a cloned `Range` for contenteditable. Before replacing, it checks with `isSelectionUnchanged` that the text wasn't edited during translation. Only input types that support the selection API count (text/search/url/tel).
- `replace.ts`, for contenteditable: first dispatches a synthetic `paste` event. Model-based editors (CKEditor, Lexical, ProseMirror; e.g. Teams) revert direct DOM edits, `execCommand` included, but they handle paste and cancel it, and a cancelled paste means done. Otherwise, and for inputs and textareas, it uses `document.execCommand('insertText')`, which preserves native undo and is picked up by React-style frameworks. It falls back to `setRangeText` or `Range` edits plus a synthetic `input` event. If `execCommand` returns true, trust it; don't re-apply the edit.
- `ui/translator-widget.ts` is plain DOM inside a **closed** shadow root on a fixed-position host. `preventDefault` on `mousedown` inside the widget keeps focus and the selection in the page's field, so don't remove it.
- A `requestId` counter makes stale translation responses get ignored after the widget closes.

**Testing notes**:
- Tests are colocated as `*.test.ts`. DOM tests opt into happy-dom with a `// @vitest-environment happy-dom` header, because the default environment is node.
- Because the widget's shadow root is closed, browser automation (Puppeteer) can't query it normally. Use CDP `DOM.getDocument({ pierce: true })` + `DOM.getBoxModel` to find and click its elements.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
