import { afterEach, describe, expect, it, vi } from 'vitest';
import { translate } from './api';

afterEach(() => vi.unstubAllGlobals());

const reply = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));

describe('translate', () => {
  it('posts the request and returns the translation', async () => {
    reply(200, { text: 'Hallo' });
    await expect(translate({ text: 'Hello', targetLang: 'de' }, 'http://api')).resolves.toEqual({ text: 'Hallo' });
    expect(fetch).toHaveBeenCalledWith('http://api/translate', expect.objectContaining({ method: 'POST' }));
  });

  it('surfaces the API error message', async () => {
    reply(429, { error: { message: 'Too many requests', code: 'rate-limited' } });
    await expect(translate({ text: 'Hello', targetLang: 'de' })).rejects.toThrow('Too many requests');
  });

  it('reports an unreachable API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(translate({ text: 'Hello', targetLang: 'de' })).rejects.toThrow(/Cannot reach/);
  });
});
