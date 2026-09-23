// Local development entrypoint. Production runs index.ts on Supabase Edge Functions instead;
// everything that differs between the two lives in dev-gateway.ts, never in app.ts.
// Env comes from node --env-file-if-exists (see the `dev` script), so there is no dotenv
// import-order rule to get wrong.
import { serve } from '@hono/node-server';
import { gateway } from '../dev/dev-gateway.ts';

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: gateway.fetch, port }, ({ port }) => {
  console.info(`AI Translator API (local) on http://127.0.0.1:${port}/functions/v1/api`);
});
