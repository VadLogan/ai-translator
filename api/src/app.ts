import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import {
  LANGUAGE_CODE,
  MAX_FAVORITE_LANGUAGES,
  MAX_TEXT_LENGTH,
  MAX_URL_LENGTH,
  type ApiErrorCode,
  type DetectBody,
  type DetectOk,
  type Settings,
  type TranslateBody,
  type TranslateOk,
} from '../../shared/contract.ts';
import { translate } from './translate.ts';
import { detectLang } from './detect.ts';
import { translationsRepository } from './repositories/translations.ts';
import { detectionsRepository } from './repositories/detections.ts';
import { profilesRepository } from './repositories/profiles.ts';
import { env } from './env.ts';

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

// The gateway verified this JWT's signature before invoking us ([functions.api] verify_jwt = true
// in supabase/config.toml) and rejects the publishable key, so we only read claims here.
// Do NOT set verify_jwt = false without adding signature verification, or `sub` becomes forgeable.
function userIdFrom(authorization: string | undefined): string | null {
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

function parseSettings(body: unknown): Settings | string {
  if (typeof body !== 'object' || body === null) return 'Body must be a JSON object';
  const { favoriteLanguages } = body as Record<string, unknown>;
  if (!Array.isArray(favoriteLanguages)) return 'favoriteLanguages must be an array';
  if (favoriteLanguages.length > MAX_FAVORITE_LANGUAGES) {
    return `favoriteLanguages must have at most ${MAX_FAVORITE_LANGUAGES} entries`;
  }
  if (!favoriteLanguages.every((code) => typeof code === 'string' && LANGUAGE_CODE.test(code))) {
    return 'favoriteLanguages contains an invalid language code';
  }
  return { favoriteLanguages: favoriteLanguages as string[] };
}

/** The text + url both request bodies share. Returns the reason as a string when it is invalid. */
function parseDetectBody(body: unknown): DetectBody | string {
  if (typeof body !== 'object' || body === null) return 'Body must be a JSON object';
  const { text, url } = body as Record<string, unknown>;
  if (typeof text !== 'string' || !text.trim()) return 'text is required';
  if (text.length > MAX_TEXT_LENGTH) return `text must be at most ${MAX_TEXT_LENGTH} characters`;
  // Bound the url rather than trusting the caller -- a signed-in client can still send junk. Never parsed.
  if (url !== undefined && (typeof url !== 'string' || url.length > MAX_URL_LENGTH)) return 'url is invalid';
  return { text, ...(typeof url === 'string' ? { url } : {}) };
}

function parseBody(body: unknown): TranslateBody | string {
  const parsed = parseDetectBody(body);
  if (typeof parsed === 'string') return parsed;
  const { targetLang, sourceLang } = body as Record<string, unknown>;
  if (typeof targetLang !== 'string' || !LANGUAGE_CODE.test(targetLang)) return 'targetLang is invalid';
  if (sourceLang !== undefined && (typeof sourceLang !== 'string' || !LANGUAGE_CODE.test(sourceLang))) {
    return 'sourceLang is invalid';
  }
  return {
    ...parsed,
    targetLang,
    ...(typeof sourceLang === 'string' ? { sourceLang } : {}),
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

// Settings live server-side so they follow the user across devices; the extension keeps a
// chrome.storage copy as a cache. Awaited, unlike the translate save -- the caller needs the result.
app.get('/settings', async (c) => {
  const userId = userIdFrom(c.req.header('authorization'));
  if (!userId) return fail(c, 401, 'unauthenticated', 'Sign in to load your settings');

  return c.json(await profilesRepository.settings(userId));
});

app.put('/settings', async (c) => {
  const userId = userIdFrom(c.req.header('authorization'));
  if (!userId) return fail(c, 401, 'unauthenticated', 'Sign in to save your settings');

  const parsed = parseSettings(await c.req.json().catch(() => null));
  if (typeof parsed === 'string') return fail(c, 400, 'invalid-input', parsed);

  return c.json(await profilesRepository.saveSettings(userId, parsed));
});

// Asked for when the in-page menu opens, before a target language is picked, so the widget can
// show what the selection is written in. Same shape as /translate: auth, rate limit, log, save.
app.post('/detect', async (c) => {
  const userId = userIdFrom(c.req.header('authorization'));
  if (!userId) return fail(c, 401, 'unauthenticated', 'Sign in to detect the language');
  if (isRateLimited(userId)) return fail(c, 429, 'rate-limited', 'Too many requests, slow down');

  const parsed = parseDetectBody(await c.req.json().catch(() => null));
  if (typeof parsed === 'string') return fail(c, 400, 'invalid-input', parsed);

  const rowId = crypto.randomUUID();
  const id = rowId.slice(0, 8);
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  const save = (outcome: { result?: DetectOk; error?: unknown }) =>
    detectionsRepository
      .save({ id: rowId, userId, request: parsed, ...outcome, durationMs: ms() })
      .catch((dbError) => console.error(`[detect ${id}] db save failed`, dbError));

  console.info(`[detect ${id}] \u2192 ${new Date().toISOString()}`, JSON.stringify(parsed, null, 2));
  try {
    const result = await detectLang(parsed);
    console.info(`[detect ${id}] \u2190 ${ms()}ms`, JSON.stringify(result, null, 2));
    waitUntil(save({ result }));
    return c.json(result);
  } catch (error) {
    console.error(`[detect ${id}] \u2717 ${ms()}ms`, error);
    waitUntil(save({ error }));
    return fail(c, 502, 'provider-failed', 'Language detection failed');
  }
});

app.post('/translate', async (c) => {
  const userId = userIdFrom(c.req.header('authorization'));
  if (!userId) return fail(c, 401, 'unauthenticated', 'Sign in to translate');
  if (isRateLimited(userId)) return fail(c, 429, 'rate-limited', 'Too many requests, slow down');

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
      .save({ id: rowId, userId, request: parsed, ...outcome, durationMs: ms() })
      .catch((dbError) => console.error(`[translate ${id}] db save failed`, dbError));

  // What the client translated with is the only verdict we get on the detection it was given:
  // same language = the user accepted it, a different one = the user corrected it.
  if (parsed.sourceLang) {
    waitUntil(
      detectionsRepository
        .verify(userId, parsed.text, parsed.sourceLang)
        .catch((dbError) => console.error(`[translate ${id}] detection verify failed`, dbError)),
    );
  }

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

function fail(c: Context, status: 400 | 401 | 404 | 429 | 502, code: ApiErrorCode, message: string) {
  return c.json({ error: { message, code } }, status);
}
