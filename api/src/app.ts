import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { MAX_TEXT_LENGTH, type ApiErrorCode, type TranslateBody } from '../../shared/contract.ts';
import { translate } from './translate.ts';
import "dotenv/config";

const RATE_LIMIT = 60; // requests per minute per IP
// ponytail: in-memory, per-instance; move to Redis if this ever runs on more than one box.
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
  const { text, targetLang, sourceLang } = body as Record<string, unknown>;
  if (typeof text !== 'string' || !text.trim()) return 'text is required';
  if (text.length > MAX_TEXT_LENGTH) return `text must be at most ${MAX_TEXT_LENGTH} characters`;
  if (typeof targetLang !== 'string' || !/^[a-zA-Z-]{2,8}$/.test(targetLang)) return 'targetLang is invalid';
  return { text, targetLang, ...(typeof sourceLang === 'string' ? { sourceLang } : {}) };
}

export const app = new Hono();

// Requests come from the extension's background worker (chrome-extension://<id>).
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());
      if (!allowed?.length) return origin; // dev default: reflect any origin
      return allowed.includes(origin) ? origin : null;
    },
  }),
);

app.get('/health', (c) => c.json({ ok: true }));

app.post('/translate', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (isRateLimited(ip)) return fail(c, 429, 'rate-limited', 'Too many requests, slow down');

  const body = await c.req.json().catch(() => null);
  const parsed = parseBody(body);
  if (typeof parsed === 'string') return fail(c, 400, 'invalid-input', parsed);

  try {
    return c.json(await translate(parsed));
  } catch (error) {
    console.error('[translate] failed:', error);
    return fail(c, 502, 'provider-failed', 'Translation provider failed');
  }
});

app.notFound((c) => fail(c, 404, 'not-found', `No route for ${c.req.method} ${c.req.path}`));

function fail(c: Context, status: 400 | 404 | 429 | 502, code: ApiErrorCode, message: string) {
  return c.json({ error: { message, code } }, status);
}
