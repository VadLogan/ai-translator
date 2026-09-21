import { createMiddleware } from 'hono/factory';
import {
  LANGUAGE_CODE,
  MAX_FAVORITE_LANGUAGES,
  MAX_TEXT_LENGTH,
  MAX_URL_LENGTH,
  type DetectBody,
  type Settings,
  type TranslateBody,
} from '../../../shared/contract.ts';
import { fail, type AppEnv } from '../http.ts';

/**
 * Validates the JSON body with `parse` and puts the result on the context, or 400s with the
 * reason. Controllers read it back with one `c.get('body') as …` -- the route table pairs the
 * parser with its controller on the same line.
 */
export const validate = <T>(parse: (body: unknown) => T | string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const parsed = parse(await c.req.json().catch(() => null));
    if (typeof parsed === 'string') return fail(c, 400, 'invalid-input', parsed);

    c.set('body', parsed);
    await next();
  });

export function parseSettings(body: unknown): Settings | string {
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
export function parseDetectBody(body: unknown): DetectBody | string {
  if (typeof body !== 'object' || body === null) return 'Body must be a JSON object';
  const { text, url } = body as Record<string, unknown>;
  if (typeof text !== 'string' || !text.trim()) return 'text is required';
  if (text.length > MAX_TEXT_LENGTH) return `text must be at most ${MAX_TEXT_LENGTH} characters`;
  // Bound the url rather than trusting the caller -- a signed-in client can still send junk. Never parsed.
  if (url !== undefined && (typeof url !== 'string' || url.length > MAX_URL_LENGTH)) return 'url is invalid';
  return { text, ...(typeof url === 'string' ? { url } : {}) };
}

export function parseTranslateBody(body: unknown): TranslateBody | string {
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
