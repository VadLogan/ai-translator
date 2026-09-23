import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env.ts';
import { fail, type AppEnv } from './utils/http.ts';
import { requireUser } from './middleware/auth.ts';
import { rateLimit } from './middleware/rate-limit.ts';
import { parseDetectBody, parseRewriteBody, parseSettings, parseTranslateBody, validate } from './middleware/body.ts';
import { getSettings, putSettings } from './controllers/settings.ts';
import { detectController } from './controllers/detect.ts';
import { translateController } from './controllers/translate.ts';
import { fixGrammarController } from './controllers/fix-grammar.ts';
import { rewriteController } from './controllers/rewrite.ts';

// Wiring only: CORS, the route table, notFound. Guards are middleware, work is a controller.
// Never branch on the runtime here -- that belongs in an entrypoint or dev-gateway.ts.

// basePath matches the function name: Supabase strips /functions/v1 and the app sees /api/*.
export const app = new Hono<AppEnv>().basePath('/api');

// Requests come from the extension's background worker (chrome-extension://<id>).
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = env('ALLOWED_ORIGINS')?.split(',').map((o) => o.trim());
      if (!allowed?.length) return origin; // dev default: reflect any origin
      return allowed.includes(origin) ? origin : null;
    },
  }),
);

app.get('/settings', requireUser('Sign in to load your settings'), getSettings);

app.put('/settings', requireUser('Sign in to save your settings'), validate(parseSettings), putSettings);

// rateLimit on the provider routes only, and after requireUser -- it counts per user id.
app.post('/detect', requireUser('Sign in to detect the language'), rateLimit, validate(parseDetectBody), detectController);

app.post('/translate', requireUser('Sign in to translate'), rateLimit, validate(parseTranslateBody), translateController);

// Same body as /detect: text + url.
app.post('/fix-grammar', requireUser('Sign in to fix grammar'), rateLimit, validate(parseDetectBody), fixGrammarController);

app.post('/rewrite', requireUser('Sign in to rewrite'), rateLimit, validate(parseRewriteBody), rewriteController);

app.notFound((c) => fail(c, 404, 'not-found', `No route for ${c.req.method} ${c.req.path}`));
