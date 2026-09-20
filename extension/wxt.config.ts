import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  // Not dot-prefixed so the folder shows up in Chrome's "Load unpacked" file picker.
  outDir: 'output',
  manifest: {
    name: 'AI Translator',
    description: 'Select text in any input field and translate it in place.',
    permissions: ['storage'],
    // The backend API: the local Supabase stack, plus the deployed edge function.
    // Swap <project-ref> for the real one; WXT_API_URL must point at the same origin.
    host_permissions: ['http://127.0.0.1:54321/*', 'https://<project-ref>.supabase.co/*'],
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
