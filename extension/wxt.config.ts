import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'AI Translator',
    description: 'Select text in any input field and translate it in place.',
    permissions: ['storage'],
    // The backend API. Add the production origin here when hosting is chosen.
    host_permissions: ['http://127.0.0.1:8787/*'],
    action: { default_title: 'AI Translator settings' },
  },
  // Pinned so a dev build always points at the same reload socket; WXT otherwise
  // takes the first free port in 3000-3010, which other projects may already hold.
  dev: { server: { port: 3016 } },
  webExt: {
    // Served by `npm run dev:playground`; harmless 404 tab with plain `npm run dev`.
    startUrls: ['http://127.0.0.1:5555/'],
  },
});
