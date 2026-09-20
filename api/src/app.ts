import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { MAX_TEXT_LENGTH, MAX_URL_LENGTH, type ApiErrorCode, type TranslateBody, type TranslateOk } from '../../shared/contract.ts';
import { translate } from './translate.ts';
import { checkDb } from './db.ts';
import { translationsRepository } from './repositories/translations.ts';
import { env } from './env.ts';

const RATE_LIMIT = 60; // requests per minute per IP
// ponytail: per-isolate Map, so the real ceiling is 60/min x live instances.
// Move to a shared store only if abuse actually shows up in the logs.
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, now = Date.now()): boolean {
  const entry = hits.get(ip);
  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function parseBody(body: unknown): TranslateBody | string {
  if (typeof body !== 'object' || body === null) return 'Body must be a JSON object';
  const { text, targetLang, sourceLang, url } = body as Record<string, unknown>;
  if (typeof text !== 'string' || !text.trim()) return 'text is required';
  if (text.length > MAX_TEXT_LENGTH) return `text must be at most ${MAX_TEXT_LENGTH} characters`;
  if (typeof targetLang !== 'string' || !/^[a-zA-Z-]{2,8}$/.test(targetLang)) return 'targetLang is invalid';
  // The endpoint is public, so bound the url rather than trusting the caller; content is not parsed.
  if (url !== undefined && (typeof url !== 'string' || url.length > MAX_URL_LENGTH)) return 'url is invalid';
  return {
    text,
    targetLang,
    ...(typeof sourceLang === 'string' ? { sourceLang } : {}),
    ...(typeof url === 'string' ? { url } : {}),
  };
}

// basePath matches the function name: Supabase strips /functions/v1 and the app sees /api/*.
export const app = new Hono().basePath('/api');

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

// 503 when the database is configured but unreachable, so a load balancer stops routing here.
app.get('/health', async (c) => {
  const db = await checkDb();
  return c.json({ ok: db !== 'down', db }, db === 'down' ? 503 : 200);
});

app.post('/translate', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (isRateLimited(ip)) return fail(c, 429, 'rate-limited', 'Too many requests, slow down');

  const body = await c.req.json().catch(() => null);
  const parsed = parseBody(body);
  if (typeof parsed === 'string') return fail(c, 400, 'invalid-input', parsed);

  // The log id (same on the →, ←, ✗ lines) is the first 8 chars of the saved row's id.
  const rowId = crypto.randomUUID();
  const id = rowId.slice(0, 8);
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  const save = (outcome: { result?: TranslateOk; error?: unknown }) =>
    // Not awaited: saving must not slow down or fail the translation.
    translationsRepository
      .save({ id: rowId, request: parsed, ...outcome, durationMs: ms() })
      .catch((dbError) => console.error(`[translate ${id}] db save failed`, dbError));

  console.info(`[translate ${id}] → ${new Date().toISOString()}`, JSON.stringify(parsed, null, 2));
  try {
    const result = await translate(parsed);
    console.info(`[translate ${id}] ← ${ms()}ms`, JSON.stringify(result, null, 2));
    waitUntil(save({ result }));
    return c.json(result);
  } catch (error) {
    console.error(`[translate ${id}] ✗ ${ms()}ms`, error);
    waitUntil(save({ error }));
    return fail(c, 502, 'provider-failed', 'Translation provider failed');
  }
});

app.notFound((c) => fail(c, 404, 'not-found', `No route for ${c.req.method} ${c.req.path}`));

// Supabase freezes the isolate once the response is returned; waitUntil keeps it alive
// until the insert lands. No-op under vitest, where the promise just runs to completion.
function waitUntil(promise: Promise<unknown>) {
  (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime?.waitUntil(promise);
}

function fail(c: Context, status: 400 | 404 | 429 | 502, code: ApiErrorCode, message: string) {
  return c.json({ error: { message, code } }, status);
}
