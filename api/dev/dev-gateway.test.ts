import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gateway } from './dev-gateway.ts';
import { signJwt } from './dev-jwt.ts';
import { checkDb } from '../src/resources/db.ts';
import { translationsRepository } from '../src/repositories/translations.ts';

// Same boundaries as app.test.ts: no key, no DB, no network.
vi.mock('../src/resources/aiClient/requests/translate.ts', () => ({
  translate: vi.fn(async ({ text, targetLang }) => ({ text: `[${targetLang}] ${text}` })),
}));
vi.mock('../src/resources/aiClient/requests/detect.ts', () => ({ detectLang: vi.fn(async () => ({ lang: 'en' })) }));
vi.mock('../src/resources/aiClient/requests/fix-grammar/fix-grammar.ts', () => ({ fixGrammar: vi.fn(async ({ text }) => ({ text, html: text })) }));
vi.mock('../src/resources/aiClient/requests/rewrite.ts', () => ({ rewrite: vi.fn(async ({ text, style }) => ({ text: `[${style}] ${text}` })) }));
vi.mock('../src/repositories/rewrites.ts', () => ({ rewritesRepository: { save: vi.fn(async () => {}) } }));
vi.mock('../src/repositories/corrections.ts', () => ({ correctionsRepository: { save: vi.fn(async () => {}) } }));
vi.mock('../src/resources/db.ts', () => ({ checkDb: vi.fn(async () => 'disabled') }));
vi.mock('../src/repositories/translations.ts', () => ({ translationsRepository: { save: vi.fn(async () => {}) } }));
vi.mock('../src/repositories/detections.ts', () => ({
  detectionsRepository: { save: vi.fn(async () => {}), verify: vi.fn(async () => {}) },
}));
vi.spyOn(console, 'info').mockImplementation(() => {});

beforeEach(() => vi.clearAllMocks());

const LOCAL_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

const token = ({ secret = LOCAL_SECRET, expiresInSeconds = 3600 } = {}) =>
  signJwt(
    {
      role: 'authenticated',
      sub: '00000000-0000-4000-8000-000000000000',
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    },
    secret,
  );

const translate = (authorization?: string) =>
  gateway.request('/functions/v1/api/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
    body: JSON.stringify({ text: 'Hello', targetLang: 'de' }),
  });

describe('local gateway emulation', () => {
  it('serves health without any Authorization header', async () => {
    const res = await gateway.request('/functions/v1/health');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, db: 'disabled' });
    expect(checkDb).toHaveBeenCalled();
  });

  it('passes a correctly signed token through to the app', async () => {
    const res = await translate(`Bearer ${await token()}`);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ text: '[de] Hello' });
  });

  it('rejects a token signed with the wrong secret', async () => {
    // The case a decode-only dev server would have happily accepted.
    const res = await translate(`Bearer ${await token({ secret: 'not-the-local-secret-but-long-enough' })}`);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'UNAUTHORIZED_INVALID_JWT' });
  });

  it('rejects an expired token', async () => {
    const res = await translate(`Bearer ${await token({ expiresInSeconds: -1 })}`);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'UNAUTHORIZED_INVALID_JWT' });
  });

  it('runs a request without an Authorization header as the dev user', async () => {
    const res = await translate();

    expect(res.status).toBe(200);
    expect(translationsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: '00000000-0000-4000-8000-000000000000' }),
    );
  });

  it.each([
    ['a non-Bearer header', 'Basic aGk6dGhlcmU=', 'UNAUTHORIZED_INVALID_JWT_FORMAT'],
    ['a malformed token', 'Bearer not-a-jwt', 'UNAUTHORIZED_INVALID_JWT'],
  ])('rejects %s before the app is reached', async (_name, authorization, code) => {
    const res = await translate(authorization);

    expect(res.status).toBe(401);
    // The gateway's shape, not the app's {error:{...}} -- extension/src/api.ts relies on the status.
    await expect(res.json()).resolves.toMatchObject({ code });
  });

  it('404s unknown routes with the app JSON shape', async () => {
    const res = await gateway.request('/functions/v1/nope');

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'not-found' } });
  });
});
