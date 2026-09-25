import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  // React powers both UI surfaces (the in-page widget and the options page); HeroUI is built
  // on Tailwind v4, whose Vite plugin generates the utility classes src/ui/theme.css pulls in.
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  // Not dot-prefixed so the folder shows up in Chrome's "Load unpacked" file picker.
  outDir: 'output',
  manifest: {
    name: 'AI Translator',
    description: 'Select text in any input field and translate it in place.',
    // `identity` powers launchWebAuthFlow, the OAuth window in src/auth/oauth.ts. `activeTab` lets
    // the toolbar popup read the tab it opened over (for the per-site switch and history).
    permissions: ['storage', 'identity', 'activeTab'],
    // Pins the extension id so chrome.identity's redirect URL is stable across machines and
    // matches [auth] additional_redirect_urls in supabase/config.toml. Replace with the
    // "key" field from the Chrome Web Store listing (or a locally generated one).
    // key: '<base64 public key>',
    // The backend API: the local Node server (npm run dev:api), the local Supabase stack
    // (npm run dev:api:edge), and the deployed edge function. All three serve the same paths,
    // so one build works against any of them. Swap <project-ref> for the real one.
    host_permissions: [
      'http://127.0.0.1:8787/*',
      'http://127.0.0.1:54321/*',
      'https://<project-ref>.supabase.co/*',
    ],
    // default_popup is added by WXT from src/entrypoints/popup/.
    action: { default_title: 'AI Translator' },
  },
  // Pinned so a dev build always points at the same reload socket; WXT otherwise
  // takes the first free port in 3000-3010, which other projects may already hold.
  dev: { server: { port: 3016 } },
  webExt: {
    // Served by `npm run dev:playground`; harmless 404 tab with plain `npm run dev`.
    startUrls: ['http://127.0.0.1:5555/'],
  },
});
