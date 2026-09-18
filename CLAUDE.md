# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

npm workspaces monorepo with two parts: `extension/` (Chrome MV3 frontend, WXT + TypeScript) and `api/` (Hono backend that owns translation), plus `shared/contract.ts` for the wire types both import. The user selects text in an input, textarea, or contenteditable field. A floating icon appears; clicking it opens a menu of favorite languages, and picking one replaces the selection with the translation fetched from the API.

**The extension must not translate in-process.** A provider key shipped in the extension is public. Real providers go in `api/src/translate.ts`; the extension only calls `POST /translate` via `ApiTranslator`. The `mock` provider stays only as an offline fallback.

## Commands

Root commands fan out to both workspaces (`npm test`, `npm run compile`, `npm run build`); `-w extension` / `-w api` targets one.

- `npm run dev` (root): API + extension dev browser + playground together
- `npm run dev:playground -w extension`: extension + `playground/` on http://127.0.0.1:5555 (opened via `webExt.startUrls` in `extension/wxt.config.ts`); the manual test environment
- `npm run dev -w api`: API only on :8787, `node --watch` (Node 24 runs the TS directly — no build step, so keep API code erasable: no enums, no parameter properties)
- `docker compose up --build`: API in a container on 127.0.0.1:8787 (same address as `npm run dev -w api`, so don't run both). Build context is the repo root; `api/Dockerfile` installs from the lockfile.
- `npm run build`: production build into `extension/.output/chrome-mv3`. Load it unpacked from `chrome://extensions`.
- `npm run compile`: type check. The extension needs the generated `.wxt/` types; run `npx wxt prepare` in `extension/` on a fresh checkout or after adding entrypoints.
- `npm test`: all unit tests (Vitest), both workspaces
- `npm run deploy`: compile + test + zip + `wxt submit` to the Chrome Web Store. Credentials live in the git-ignored `.env.submit`, created by `npx wxt submit init`. Bump `package.json` version first, because the manifest version comes from it. `npm run deploy:check` is a dry run.
- Single test file: `npx vitest run src/core/registry.test.ts` from inside `extension/` or `api/`. Single test by name: `npx vitest run -t "wraps provider failures"`.

There is no linter configured. `playground/index.html` has one of each field type.

## Architecture

`srcDir` is `src`, so WXT entrypoints live in `src/entrypoints/` (`background.ts`, `content.ts`, `options/`). Import WXT APIs explicitly from subpaths (`wxt/browser`, `wxt/utils/storage`, `wxt/utils/define-background`, …) instead of relying on auto-imports.

**Dependency inversion for translation engines** is the core design constraint:
- `src/core/` holds pure abstractions and must not import WXT, browser APIs, or concrete providers:
  - `Translator` and `TranslatorFactory` (in `translator.ts`)
  - `TranslatorRegistry`
  - `TranslationService`, which depends on the `SettingsReader` interface from `src/settings/settings.ts`
- `src/providers/` holds the concrete engines: `api/api-translator.ts` (default; base URL from `WXT_API_URL`, falling back to `http://127.0.0.1:8787`, whose origin must be in `host_permissions`) and `mock/` (offline fallback). Both are registered in `src/providers/index.ts`.
- `src/entrypoints/background.ts` is the **only composition root**: it builds the registry and service and wires in `storageSettings` (the `chrome.storage` implementation in `src/settings/storage-settings.ts`). A translator is created per request from `settings.activeProviderId` and `settings.providerConfigs[id]`, so config changes apply immediately.
- To add a provider:
  1. Implement `Translator` and export a `TranslatorFactory`.
  2. Register it in `src/providers/index.ts`.
  3. Add the API host to `host_permissions` in `wxt.config.ts`.
  4. Store its config (such as an API key) under `providerConfigs[id]`.

  The options page lists providers automatically. See README.md for an example.

**API** (`api/`): `app.ts` is the Hono app (routes, CORS, in-memory rate limit, boundary validation); `translate.ts` is the swappable provider call plus the per-request log. `server.ts` only starts it, so tests hit `app.request()` with no port. Error bodies are `{error:{message, code}}` and `ApiTranslator` maps them to `TranslationError`; keep the codes in sync with `shared/contract.ts`.

**Runtime flow**: The content script and the options page talk to the background worker only through the typed protocol in `src/messaging/messages.ts` (`translate`, `list-providers`, `open-options`). Responses are `{ ok, data } | { ok: false, error }`, because `Error` objects don't survive messaging. When adding a message type, update both `Message` and `ResponseMap`. Translation must stay in the background worker so page scripts never see API keys and CORS doesn't apply.

**Content script** (`src/entrypoints/content.ts` + `src/content/`):
- `selection.ts` snapshots the selection when the icon appears: offsets for text controls, a cloned `Range` for contenteditable. Before replacing, it checks with `isSelectionUnchanged` that the text wasn't edited during translation. Only input types that support the selection API count (text/search/url/tel).
- `replace.ts` prefers `document.execCommand('insertText')`, which preserves native undo and is picked up by React-style frameworks. It falls back to `setRangeText` or `Range` edits plus a synthetic `input` event. If `execCommand` returns true, trust it; don't re-apply the edit.
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
