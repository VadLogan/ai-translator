# AI Translator

Chrome extension (Manifest V3, [WXT](https://wxt.dev) + TypeScript). Select text in any input, textarea, or contenteditable field. A translate icon appears; click it, pick a language, and the selection is replaced with the translation. Ctrl/Cmd+Z undoes the replacement.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev build with hot reload, opens a browser with the extension |
| `npm run dev:playground` | Same, plus serves `playground/` at http://127.0.0.1:5555 and opens it: the test page |
| `npm run build` | Production build into `.output/chrome-mv3` |
| `npm run zip` | Zip for the Chrome Web Store |
| `npm run deploy:check` | Zip + verify Chrome Web Store credentials without uploading |
| `npm run deploy` | Type check, test, zip, upload and submit for review |
| `npm test` | Unit tests (Vitest + happy-dom) |
| `npm run compile` | Type check |

To load the build manually, go to `chrome://extensions`, turn on Developer mode, click **Load unpacked**, and choose `.output/chrome-mv3`.

## Deploying to the Chrome Web Store

1. One-time setup:
   - Upload the first zip (`npm run zip`) by hand in the [developer dashboard](https://chrome.google.com/webstore/devconsole). The API can only update an existing item.
   - Run `npx wxt submit init` to store the extension ID and API credentials in `.env.submit`. That file is git-ignored.
2. Every release:
   - Bump the version with `npm version patch --no-git-tag-version`. The store rejects a version it has already seen.
   - Run `npm run deploy:check`, then `npm run deploy`.

## Architecture

```
content script (UI)  ──message──▶  background service worker (composition root)
  detect selection                    TranslationService
  icon + language menu                  ├─ TranslatorRegistry ──▶ TranslatorFactory ──▶ Translator
  replace selected text                 └─ SettingsReader (chrome.storage)
```

- `src/core` holds the abstractions and has no browser or provider dependencies: the `Translator` interface, the registry, and the service.
- `src/providers` contains the concrete engines. Only `src/entrypoints/background.ts` wires them in, through `registerProviders`.
- Translation runs in the background worker, so page scripts never see provider API keys and CORS doesn't apply.

## Adding a translation provider

1. Create `src/providers/<name>/<name>-translator.ts`:

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

2. Register it in `src/providers/index.ts`: `registry.register(deeplTranslatorFactory)`.
3. Add the API host to `host_permissions` in `wxt.config.ts`, for example `https://api-free.deepl.com/*`.
4. Add config inputs (such as an API key) to the options page and save them to `settings.providerConfigs[<id>]`.

The provider then appears automatically in the options page's provider dropdown.
