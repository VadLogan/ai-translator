import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from './app.ts';
import { translate } from './translate.ts';
import { translationsRepository } from './repositories/translations.ts';

// The real provider calls OpenAI; tests only cover the HTTP layer.
vi.mock('./translate.ts', () => ({
  translate: vi.fn(async ({ text, targetLang }) => ({ text: `[${targetLang}] ${text}` })),
}));
vi.mock('./repositories/translations.ts', () => ({ translationsRepository: { save: vi.fn(async () => {}) } }));
vi.spyOn(console, 'info').mockImplementation(() => {});

// Call counts are asserted per test; implementations set in the factories above survive this.
beforeEach(() => vi.clearAllMocks());

/**
 * An unsigned JWT. The gateway verifies signatures before the app ever runs
 * (verify_jwt = true), so userIdFrom only decodes the payload -- that is all these need.
 */
const jwt = (claims: Record<string, unknown>) =>
  `h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`;

const userToken = (sub = crypto.randomUUID()) => jwt({ role: 'authenticated', sub });

const post = (body: unknown, authorization: string | null = `Bearer ${userToken()}`) =>
  app.request('/api/translate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authorization ? { authorization } : {}),
    },
    body: JSON.stringify(body),
  });

describe('POST /translate', () => {
  it('returns the translation and saves it against the signed-in user', async () => {
    const sub = crypto.randomUUID();
    const res = await post({ text: 'Hello', targetLang: 'de' }, `Bearer ${userToken(sub)}`);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ text: '[de] Hello' });
    expect(translationsRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: sub, request: { text: 'Hello', targetLang: 'de' }, result: { text: '[de] Hello' } }),
    );
  });

  it.each([
    ['no Authorization header', null],
    ['a non-Bearer header', 'Basic aGk6dGhlcmU='],
    ['a malformed token', 'Bearer not-a-jwt'],
    ['a token whose payload is not JSON', 'Bearer h.bm90LWpzb24.sig'],
    ['the anon key rather than a user', `Bearer ${jwt({ role: 'anon' })}`],
    ['a user token with no sub', `Bearer ${jwt({ role: 'authenticated' })}`],
  ])('401s %s', async (_name, authorization) => {
    const res = await post({ text: 'Hello', targetLang: 'de' }, authorization);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'unauthenticated' } });
    expect(translationsRepository.save).not.toHaveBeenCalled();
  });

  it('passes the page url through to the saved row', async () => {
    await post({ text: 'Hello', targetLang: 'de', url: 'https://teams.microsoft.com/chat' });

    expect(translationsRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ request: expect.objectContaining({ url: 'https://teams.microsoft.com/chat' }) }),
    );
  });

  it('502s when the provider fails and saves the error', async () => {
    const boom = new Error('provider down');
    vi.mocked(translate).mockRejectedValueOnce(boom);
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await post({ text: 'Hello', targetLang: 'de' });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'provider-failed' } });
    expect(translationsRepository.save).toHaveBeenLastCalledWith(expect.objectContaining({ error: boom }));
  });

  it('still answers when saving fails', async () => {
    vi.mocked(translationsRepository.save).mockRejectedValueOnce(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    expect((await post({ text: 'Hello', targetLang: 'de' })).status).toBe(200);
  });

  it.each([
    ['blank text', { text: '   ', targetLang: 'de' }],
    ['missing text', { targetLang: 'de' }],
    ['bad targetLang', { text: 'Hello', targetLang: 'deutsch!' }],
    ['too long', { text: 'x'.repeat(5001), targetLang: 'de' }],
    ['non-string url', { text: 'Hello', targetLang: 'de', url: 42 }],
    ['oversized url', { text: 'Hello', targetLang: 'de', url: `https://e.com/${'x'.repeat(2048)}` }],
  ])('rejects %s with 400', async (_name, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'invalid-input' } });
  });

  it('rate limits one noisy user without touching another', async () => {
    const noisy = `Bearer ${userToken()}`;
    const send = () => post({ text: 'Hello', targetLang: 'de' }, noisy);
    vi.spyOn(console, 'info').mockImplementation(() => {});

// Call counts are asserted per test; implementations set in the factories above survive this.
beforeEach(() => vi.clearAllMocks());

    for (let i = 0; i < 60; i++) expect((await send()).status).toBe(200);
    const blocked = await send();

    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toMatchObject({ error: { code: 'rate-limited' } });
    // A different user has their own bucket.
    expect((await post({ text: 'Hello', targetLang: 'de' })).status).toBe(200);
    vi.restoreAllMocks();
  });
});

it('404s unknown routes', async () => {
  const res = await app.request('/nope');
  expect(res.status).toBe(404);
  await expect(res.json()).resolves.toMatchObject({ error: { code: 'not-found' } });
});
