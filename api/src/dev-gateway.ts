import { Hono } from 'hono';
import { app } from './app.ts';
import { handler as health } from './health.ts';
import { verifyJwt } from './dev-jwt.ts';

/**
 * Emulates the Supabase gateway for local development: the same URL prefixes, the same 401 bodies,
 * and a real signature check standing in for `verify_jwt = true`.
 *
 * This is the ONLY place that compensates for the missing platform -- app.ts must stay byte-identical
 * across runtimes. It is an emulation, so run `npm run dev:api:edge` before deploying.
 */

/** The gateway's own error shape, which is NOT the app's -- it rejects before the app is reached. */
const reject = (code: string, message: string) => Response.json({ code, message, msg: message }, { status: 401 });

export const gateway = new Hono();

// [functions.health] verify_jwt = false
gateway.get('/functions/v1/health', () => health());

// [functions.api] verify_jwt = true
gateway.use('/functions/v1/api/*', async (c, next) => {
  const authorization = c.req.header('authorization');
  if (!authorization) return reject('UNAUTHORIZED_NO_AUTH_HEADER', 'Missing authorization header');

  const token = authorization.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return reject('UNAUTHORIZED_INVALID_JWT_FORMAT', 'Invalid JWT format');
  if (!(await verifyJwt(token))) return reject('UNAUTHORIZED_INVALID_JWT', 'Invalid JWT');

  await next();
});

// route() rather than rewriting the Request: a POST body is a stream, and re-wrapping one in Node
// needs `duplex: 'half'`. app's basePath('/api') completes the path to /functions/v1/api/*.
// Known cosmetic drift from this: the real gateway strips /functions/v1 before the app sees it,
// so a 404's `message` names /api/nope there and /functions/v1/api/nope here. Status and `code`
// match, which is what clients read -- not worth rebuilding the Request to align the string.
gateway.route('/functions/v1', app);
// Mirrors app.ts's own notFound body. Kept local so dev-only tooling doesn't force an export out
// of the production app; app.test.ts and dev-gateway.test.ts both assert the shape, so it can't drift.
gateway.notFound((c) =>
  c.json({ error: { message: `No route for ${c.req.method} ${c.req.path}`, code: 'not-found' } }, 404),
);
