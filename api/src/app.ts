import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env.ts';
import { fail, type AppEnv } from './utils/http.ts';
import { requireUser } from './middleware/auth.ts';
import { rateLimit } from './middleware/rate-limit.ts';
import { guardText } from './middleware/guard.ts';
import { parseDetectBody, parseFixGrammarBody, parseRewriteBody, parseSettings, parseTranscribeBody, parseTranslateBody, validate } from './middleware/body.ts';
import { getSettings, putSettings } from './controllers/settings.ts';
import { detectController } from './controllers/detect.ts';
import { translateController } from './controllers/translate.ts';
import { fixGrammarController } from './controllers/fix-grammar.ts';
import { rewriteController } from './controllers/rewrite.ts';
import { checkController } from './controllers/check.ts';
import { transcribeController } from './controllers/transcribe.ts';
import { voiceSessionController } from './controllers/voiceSession.ts';

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
// guardText after validate: it reads the body's text, and 422s a wrong layout or gibberish before
// the provider call.
app.post('/detect', requireUser('Sign in to detect the language'), rateLimit, validate(parseDetectBody), guardText, detectController);

app.post('/translate', requireUser('Sign in to translate'), rateLimit, validate(parseTranslateBody), guardText, translateController);

// Same body as /detect: text + url.
app.post('/fix-grammar', requireUser('Sign in to fix grammar'), rateLimit, validate(parseFixGrammarBody), fixGrammarController); // guards itself, in parallel with the fix

// The field icon's badge: the error count only. The fix itself is asked on click (/fix-grammar).
app.post('/check', requireUser('Sign in to check grammar'), rateLimit, validate(parseDetectBody), checkController); // guards itself, in the same call as the count

app.post('/rewrite', requireUser('Sign in to rewrite'), rateLimit, validate(parseRewriteBody), guardText, rewriteController);

// Voice input: multipart audio in, {text, lang} out. No guardText -- there is no typed text to guard.
app.post('/transcribe', requireUser('Sign in to use voice input'), rateLimit, validate(parseTranscribeBody), transcribeController);

// Live voice input: a client secret for a Realtime transcription socket. No body; /transcribe is the fallback.
app.post('/voice-session', requireUser('Sign in to use voice input'), rateLimit, voiceSessionController);

app.notFound((c) => fail(c, 404, 'not-found', `No route for ${c.req.method} ${c.req.path}`));
