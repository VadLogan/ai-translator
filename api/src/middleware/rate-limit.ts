import { createMiddleware } from 'hono/factory';
import { fail, type AppEnv } from '../utils/http.ts';

const RATE_LIMIT = 60; // requests per minute per user
// ponytail: per-isolate Map, so the real ceiling is 60/min x live instances.
// Move to a shared store only if abuse actually shows up in the logs.
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string, now = Date.now()): boolean {
  const entry = hits.get(userId);
  if (!entry || now >= entry.resetAt) {
    hits.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/** Counts per user, so it has to run after requireUser. Only on the provider routes. */
export const rateLimit = createMiddleware<AppEnv>(async (c, next) => {
  if (isRateLimited(c.get('userId'))) return fail(c, 429, 'rate-limited', 'Too many requests, slow down');

  await next();
});
