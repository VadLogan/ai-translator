import type { Context } from 'hono';
import type { ApiErrorCode } from '../../shared/contract.ts';

/** What the middleware chain puts on the context for the controllers. */
export type AppEnv = { Variables: { userId: string; body: unknown } };

export function fail(c: Context, status: 400 | 401 | 404 | 429 | 502, code: ApiErrorCode, message: string) {
  return c.json({ error: { message, code } }, status);
}

// Supabase freezes the isolate once the response is returned; waitUntil keeps it alive
// until the insert lands. No-op under vitest, where the promise just runs to completion.
export function waitUntil(promise: Promise<unknown>) {
  (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime?.waitUntil(promise);
}
