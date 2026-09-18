# AI Translator

Select text in any input, textarea, or contenteditable field on a web page. A translate icon appears; click it, pick a language, and the selection is replaced with the translation. Ctrl/Cmd+Z undoes it.

Two parts, one repo (npm workspaces):

| Folder | What it is |
| --- | --- |
| `extension/` | Frontend: Chrome extension (Manifest V3, [WXT](https://wxt.dev) + TypeScript) |
| `api/` | Backend: Hono API that owns translation (and later the provider key) |
| `shared/` | Request/response types used by both |

Translation never happens in the extension. The provider key would be readable by anyone if it shipped inside it, so the extension only calls `POST /translate`.

```bash
npm install     # installs both workspaces
npm run dev     # API on :8787 + extension dev browser + playground on :5555
npm test        # both test suites
```

## API

`api/` runs on Node 24 with no build step (Node executes TypeScript directly).

| Route | Behavior |
| --- | --- |
| `GET /health` | `{ ok: true }` |
| `POST /translate` | `{ text, targetLang, sourceLang? }` → `{ text }`, or `{ error: { message, code } }` with 400 / 429 / 502 |

Every request is logged with an ISO timestamp, the target language and the text. Limits: 5000 characters, 60 requests per minute per IP. `ALLOWED_ORIGINS` (comma-separated) restricts CORS; unset reflects any origin, which is fine for local dev only. `src/translate.ts` returns the test message `[de] Hello`; swap its body for a real provider call.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` (root) | API + extension dev browser + playground, all at once |
| `npm run dev -w extension` | Extension only, hot reload |
| `npm run dev:playground -w extension` | Extension + playground test page on http://127.0.0.1:5555 |
| `npm run dev -w api` | API only, restarts on change |
| `npm run build` | Production build into `extension/.output/chrome-mv3` |
| `npm run zip -w extension` | Zip for the Chrome Web Store |
| `npm run deploy:check -w extension` | Zip + verify Chrome Web Store credentials without uploading |
| `npm run deploy -w extension` | Type check, test, zip, upload and submit for review |
| `npm test` | Both test suites (Vitest) |
| `npm run compile` | Type check both workspaces |

To load the build manually, go to `chrome://extensions`, turn on Developer mode, click **Load unpacked**, and choose `extension/.output/chrome-mv3`.

## Deploying to the Chrome Web Store

1. One-time setup:
   - Upload the first zip (`npm run zip -w extension`) by hand in the [developer dashboard](https://chrome.google.com/webstore/devconsole). The API can only update an existing item.
   - Run `npx wxt submit init` in `extension/` to store the extension ID and API credentials in `.env.submit`. That file is git-ignored.
2. Every release:
   - Bump the version with `npm version patch --no-git-tag-version`. The store rejects a version it has already seen.
   - Run `npm run deploy:check -w extension`, then `npm run deploy -w extension`.

## Architecture

```
content script (UI)  ──message──▶  background worker  ──HTTP──▶  api/  ──▶  provider
  detect selection                   TranslationService            translate()
  icon + language menu                 └─ TranslatorRegistry         + request log
  replace selected text                     └─ ApiTranslator
```

- `extension/src/core` holds the abstractions and has no browser or provider dependencies: the `Translator` interface, the registry, and the service.
- `src/providers` contains the concrete engines: `api` (the backend, default) and `mock` (offline fallback). Only `src/entrypoints/background.ts` wires them in, through `registerProviders`.
- The API base URL comes from `WXT_API_URL` at build time, defaulting to `http://127.0.0.1:8787`. Its origin must also be in `host_permissions` in `wxt.config.ts`.

## Adding a translation provider

A real provider belongs in `api/src/translate.ts`, where its key is safe. The steps below are for adding another engine *inside the extension*, which only makes sense for keyless or on-device translation.

1. Create `extension/src/providers/<name>/<name>-translator.ts`:

   ```ts
   import { TranslationError, type Translator, type TranslatorFactory } from '../../core/translator';

   interface DeepLConfig { apiKey: string }

   class DeepLTranslator implements Translator {
     constructor(private readonly config: DeepLConfig) {}
     async translate({ text, targetLang }) {
       // call the API with this.config.apiKey ...
       return { text: translated };
     }
   }

   export const deeplTranslatorFactory: TranslatorFactory<DeepLConfig> = {
     id: 'deepl',
     displayName: 'DeepL',
     create: (config) => {
       if (!config?.apiKey) throw new TranslationError('Add your DeepL API key in settings', 'provider-failed');
       return new DeepLTranslator(config);
     },
   };
   ```

2. Register it in `extension/src/providers/index.ts`: `registry.register(deeplTranslatorFactory)`.
3. Add the API host to `host_permissions` in `extension/wxt.config.ts`, for example `https://api-free.deepl.com/*`.
4. Add config inputs (such as an API key) to the options page and save them to `settings.providerConfigs[<id>]`.

The provider then appears automatically in the options page's provider dropdown.
