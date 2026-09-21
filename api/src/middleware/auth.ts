import { createMiddleware } from 'hono/factory';
import { fail, type AppEnv } from '../http.ts';

// The gateway verified this JWT's signature before invoking us ([functions.api] verify_jwt = true
// in supabase/config.toml) and rejects the publishable key, so we only read claims here.
// Do NOT set verify_jwt = false without adding signature verification, or `sub` becomes forgeable.
export function userIdFrom(authorization: string | undefined): string | null {
  const payload = authorization?.match(/^Bearer \S+\.(\S+)\.\S*$/)?.[1];
  if (!payload) return null;
  try {
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const { role, sub } = claims as { role?: unknown; sub?: unknown };
    return role === 'authenticated' && typeof sub === 'string' ? sub : null;
  } catch {
    return null; // not base64, not JSON, or no claims at all
  }
}

/** Guards a route and puts the caller's id on the context. The message is per route. */
export const requireUser = (message: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const userId = userIdFrom(c.req.header('authorization'));
    if (!userId) return fail(c, 401, 'unauthenticated', message);

    c.set('userId', userId);
    await next();
  });
