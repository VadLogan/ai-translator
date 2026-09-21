import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, detect, getSettings, saveSettings, translate } from './api';

afterEach(() => vi.unstubAllGlobals());

const reply = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));

describe('translate', () => {
  it('posts the request and returns the translation', async () => {
    reply(200, { text: 'Hallo' });
    await expect(translate({ text: 'Hello', targetLang: 'de' }, 'token', 'http://api')).resolves.toEqual({ text: 'Hallo' });
    expect(fetch).toHaveBeenCalledWith(
      'http://api/translate',
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ authorization: 'Bearer token' }) }),
    );
  });

  it('omits the Authorization header when signed out', async () => {
    reply(401, { error: { message: 'Sign in to translate', code: 'unauthenticated' } });
    await expect(translate({ text: 'Hello', targetLang: 'de' }, null)).rejects.toThrow();
    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headers: expect.not.objectContaining({ authorization: expect.anything() }) }),
    );
  });

  it('keeps the error code so callers can tell 401 from a network failure', async () => {
    reply(401, { error: { message: 'Sign in to translate', code: 'unauthenticated' } });
    await expect(translate({ text: 'Hello', targetLang: 'de' }, null)).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Sign in to translate',
    });
  });

  it('still reports unauthenticated when the gateway rejects before the API is reached', async () => {
    // The Supabase gateway's own 401 body, which has no `error` wrapper.
    reply(401, { code: 'UNAUTHORIZED_NO_AUTH_HEADER', message: 'Missing authorization header' });
    await expect(translate({ text: 'Hello', targetLang: 'de' }, null)).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });

  it('surfaces the API error message', async () => {
    reply(429, { error: { message: 'Too many requests', code: 'rate-limited' } });
    await expect(translate({ text: 'Hello', targetLang: 'de' }, 'token')).rejects.toThrow('Too many requests');
  });

  it('reports an unreachable API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    const failure = translate({ text: 'Hello', targetLang: 'de' }, 'token');
    await expect(failure).rejects.toThrow(/Cannot reach/);
    // No code: an unreachable API must not look like a rejected sign-in.
    await expect(failure).rejects.toSatisfy((error) => error instanceof ApiError && error.code === undefined);
  });
});

describe('detect', () => {
  it('posts the text and returns the detected language', async () => {
    reply(200, { lang: 'pl' });
    await expect(detect({ text: 'Dzień dobry' }, 'token', 'http://api')).resolves.toEqual({ lang: 'pl' });
    expect(fetch).toHaveBeenCalledWith(
      'http://api/detect',
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ authorization: 'Bearer token' }) }),
    );
  });

  it('keeps the error code, so a signed-out detection is silent rather than a sign-in prompt', async () => {
    reply(401, { error: { message: 'Sign in to detect the language', code: 'unauthenticated' } });
    await expect(detect({ text: 'Hello' }, null)).rejects.toMatchObject({ code: 'unauthenticated' });
  });
});

describe('settings', () => {
  it('GETs the caller settings with the token', async () => {
    reply(200, { favoriteLanguages: ['de', 'uk'] });
    await expect(getSettings('token', 'http://api')).resolves.toEqual({ favoriteLanguages: ['de', 'uk'] });
    expect(fetch).toHaveBeenCalledWith(
      'http://api/settings',
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ authorization: 'Bearer token' }) }),
    );
  });

  it('PUTs the new list', async () => {
    reply(200, { favoriteLanguages: ['pl'] });
    await expect(saveSettings({ favoriteLanguages: ['pl'] }, 'token', 'http://api')).resolves.toEqual({
      favoriteLanguages: ['pl'],
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://api/settings',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ favoriteLanguages: ['pl'] }) }),
    );
  });

  it('surfaces unauthenticated so the worker can fall back to the cache', async () => {
    reply(401, { code: 'UNAUTHORIZED_NO_AUTH_HEADER', message: 'Missing authorization header' });
    await expect(getSettings(null, 'http://api')).rejects.toMatchObject({ code: 'unauthenticated' });
  });
});
