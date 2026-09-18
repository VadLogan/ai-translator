import { describe, expect, it, vi } from 'vitest';
import { app } from './app.ts';

const post = (body: unknown) =>
  app.request('/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.random()}` },
    body: JSON.stringify(body),
  });

describe('POST /translate', () => {
  it('translates and logs the request', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    const res = await post({ text: 'Hello', targetLang: 'de' });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ text: '[de] Hello' });
    expect(log.mock.calls[0]?.[0]).toMatch(/^\[translate] \d{4}-\d\d-\d\dT.+ → "de": Hello$/);
    log.mockRestore();
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

it('reports health', async () => {
  await expect((await app.request('/health')).json()).resolves.toEqual({ ok: true });
});
