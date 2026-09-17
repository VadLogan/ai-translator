import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'AI Translator',
    description: 'Select text in any input field and translate it in place.',
    permissions: ['storage'],
    action: { default_title: 'AI Translator settings' },
  },
  webExt: {
    // Served by `npm run dev:playground`; harmless 404 tab with plain `npm run dev`.
    startUrls: ['http://127.0.0.1:5555/'],
  },
});
