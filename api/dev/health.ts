// Public liveness probe, deployed as its own Supabase Edge Function so that [functions.api]
// can require a JWT while uptime checks stay anonymous. verify_jwt is enforced by the gateway
// before the handler runs, so this cannot just be a route on app.ts.
import { checkDb } from '../src/resources/db.ts';

/** 503 when the database is configured but unreachable, so a load balancer stops routing here. */
export async function handler(): Promise<Response> {
  const db = await checkDb();
  return Response.json({ ok: db !== 'down', db }, { status: db === 'down' ? 503 : 200 });
}

// Optional-chained so vitest can import this module without a Deno global.
(globalThis as { Deno?: { serve(h: typeof handler): void } }).Deno?.serve(handler);
