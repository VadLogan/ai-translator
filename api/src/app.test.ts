import { describe, expect, it, vi } from 'vitest';
import { app } from './app.ts';
import { checkDb } from './db.ts';
import { translate } from './translate.ts';
import { translationsRepository } from './repositories/translations.ts';

// The real provider calls OpenAI; tests only cover the HTTP layer.
vi.mock('./translate.ts', () => ({
  translate: vi.fn(async ({ text, targetLang }) => ({ text: `[${targetLang}] ${text}` })),
}));
vi.mock('./db.ts', () => ({ checkDb: vi.fn() }));
vi.mock('./repositories/translations.ts', () => ({ translationsRepository: { save: vi.fn(async () => {}) } }));
vi.spyOn(console, 'info').mockImplementation(() => {});

const post = (body: unknown) =>
  app.request('/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.random()}` },
    body: JSON.stringify(body),
  });

describe('POST /translate', () => {
  it('returns the translation and saves it', async () => {
    const res = await post({ text: 'Hello', targetLang: 'de' });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ text: '[de] Hello' });
    expect(translationsRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ request: { text: 'Hello', targetLang: 'de' }, result: { text: '[de] Hello' } }),
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
  ])('rejects %s with 400', async (_name, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'invalid-input' } });
  });

  it('rate limits a noisy client', async () => {
    const send = () =>
      app.request('/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
        body: JSON.stringify({ text: 'Hello', targetLang: 'de' }),
      });
    vi.spyOn(console, 'info').mockImplementation(() => {});

    for (let i = 0; i < 60; i++) expect((await send()).status).toBe(200);
    const blocked = await send();

    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toMatchObject({ error: { code: 'rate-limited' } });
    vi.restoreAllMocks();
  });
});

it('404s unknown routes', async () => {
  const res = await app.request('/nope');
  expect(res.status).toBe(404);
  await expect(res.json()).resolves.toMatchObject({ error: { code: 'not-found' } });
});

describe('GET /health', () => {
  it('is ok when the database is ok or not configured', async () => {
    for (const db of ['ok', 'disabled'] as const) {
      vi.mocked(checkDb).mockResolvedValueOnce(db);
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true, db });
    }
  });

  it('503s when the database is down', async () => {
    vi.mocked(checkDb).mockResolvedValueOnce('down');
    const res = await app.request('/health');
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ ok: false, db: 'down' });
  });
});
