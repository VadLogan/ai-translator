import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from './app.ts';
import { translate } from './resources/aiClient/requests/translate.ts';
import { detectLang } from './resources/aiClient/requests/detect.ts';
import { translationsRepository } from './repositories/translations.ts';
import { detectionsRepository } from './repositories/detections.ts';
import { profilesRepository } from './repositories/profiles.ts';
import { fixGrammar } from './resources/aiClient/requests/fix-grammar/fix-grammar.ts';
import { correctionsRepository } from './repositories/corrections.ts';
import { rewrite } from './resources/aiClient/requests/rewrite.ts';
import { rewritesRepository } from './repositories/rewrites.ts';
import { validateGuard } from './resources/aiClient/requests/validateGuard.ts';
import { grammarQuality } from './resources/aiClient/requests/grammarQuality.ts';
import { transcribe } from './resources/aiClient/requests/transcribe.ts';
import { transcriptionsRepository } from './repositories/transcriptions.ts';
import { voiceSession } from './resources/aiClient/requests/voiceSession.ts';
import { wordStatsRepository } from './repositories/wordStats.ts';

// The real providers call OpenAI; tests only cover the HTTP layer.
vi.mock('./resources/aiClient/requests/translate.ts', () => ({
  translate: vi.fn(async ({ text, targetLang }) => ({ text: `[${targetLang}] ${text}` })),
}));
vi.mock('./resources/aiClient/requests/detect.ts', () => ({ detectLang: vi.fn(async () => ({ lang: 'en' })) }));
vi.mock('./resources/aiClient/requests/fix-grammar/fix-grammar.ts', () => ({ fixGrammar: vi.fn(async ({ text }) => ({ text: `fixed: ${text}`, html: `fixed: ${text}`, edits: [] })) }));
vi.mock('./resources/aiClient/requests/validateGuard.ts', () => ({ validateGuard: vi.fn(async () => null), GUARD_MESSAGES: { mistyped: 'mistyped', gibberish: 'gibberish' } }));
vi.mock('./resources/aiClient/requests/grammarQuality.ts', () => ({ grammarQuality: vi.fn(async () => ({ errors: 2, verdict: null })) }));
vi.mock('./resources/aiClient/requests/rewrite.ts', () => ({ rewrite: vi.fn(async ({ text, style }) => ({ text: `[${style}] ${text}` })) }));
vi.mock('./resources/aiClient/requests/transcribe.ts', () => ({ transcribe: vi.fn(async () => ({ text: 'hello there', model: 'm' })) }));
vi.mock('./resources/aiClient/requests/voiceSession.ts', () => ({ voiceSession: vi.fn(async () => ({ secret: 'ek_test', expiresAt: 1, model: 'm' })) }));
vi.mock('./repositories/wordStats.ts', () => ({ wordStatsRepository: { read: vi.fn(() => ({ total: 3, byDay: { '2026-10-01': 3 }, dictationSeconds: { total: 9.5, byDay: { '2026-10-01': 9.5 } } })), add: vi.fn(), addDictation: vi.fn() } }));
vi.mock('./repositories/transcriptions.ts', () => ({ transcriptionsRepository: { save: vi.fn(async () => {}) } }));
vi.mock('./repositories/rewrites.ts', () => ({ rewritesRepository: { save: vi.fn(async () => {}) } }));
vi.mock('./repositories/corrections.ts', () => ({ correctionsRepository: { save: vi.fn(async () => {}) } }));
vi.mock('./repositories/translations.ts',() => ({ translationsRepository: { save: vi.fn(async () => {}) } }));
vi.mock('./repositories/detections.ts', () => ({
  detectionsRepository: { save: vi.fn(async () => {}), verify: vi.fn(async () => {}) },
}));
vi.mock('./repositories/profiles.ts', () => ({
  profilesRepository: {
    settings: vi.fn(async () => ({ favoriteLanguages: ['en', 'pl'], disabledSites: [] })),
    saveSettings: vi.fn(async (_userId: string, settings: unknown) => settings),
  },
}));
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

  it('reports the language the user translated with, so the detection is marked verified', async () => {
    const sub = crypto.randomUUID();
    await post({ text: 'Hello', targetLang: 'de', sourceLang: 'en' }, `Bearer ${userToken(sub)}`);

    expect(detectionsRepository.verify).toHaveBeenCalledWith(sub, 'Hello', 'en');
  });

  it('leaves the detection unverified when the client sends no sourceLang', async () => {
    await post({ text: 'Hello', targetLang: 'de' });

    expect(detectionsRepository.verify).not.toHaveBeenCalled();
  });

  it('still answers when marking the detection fails', async () => {
    vi.mocked(detectionsRepository.verify).mockRejectedValueOnce(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});

    expect((await post({ text: 'Hello', targetLang: 'de', sourceLang: 'en' })).status).toBe(200);
  });

  it.each([
    ['blank text', { text: '   ', targetLang: 'de' }],
    ['bad sourceLang', { text: 'Hello', targetLang: 'de', sourceLang: 'english!' }],
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

    for (let i = 0; i < 60; i++) expect((await send()).status).toBe(200);
    const blocked = await send();

    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toMatchObject({ error: { code: 'rate-limited' } });
    // A different user has their own bucket.
    expect((await post({ text: 'Hello', targetLang: 'de' })).status).toBe(200);
    vi.restoreAllMocks();
  });
});

describe('POST /detect', () => {
  const detect = (body: unknown, authorization: string | null = `Bearer ${userToken()}`) =>
    app.request('/api/detect', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
      body: JSON.stringify(body),
    });

  it('returns the detected language and saves it against the signed-in user', async () => {
    const sub = crypto.randomUUID();
    const res = await detect({ text: 'Hello', url: 'https://teams.microsoft.com/chat' }, `Bearer ${userToken(sub)}`);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ lang: 'en' });
    expect(detectionsRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        userId: sub,
        request: { text: 'Hello', url: 'https://teams.microsoft.com/chat' },
        result: { lang: 'en' },
      }),
    );
  });

  it('401s without a user token', async () => {
    const res = await detect({ text: 'Hello' }, null);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'unauthenticated' } });
    expect(detectionsRepository.save).not.toHaveBeenCalled();
  });

  it('502s when the provider fails and saves the error', async () => {
    const boom = new Error('provider down');
    vi.mocked(detectLang).mockRejectedValueOnce(boom);
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await detect({ text: 'Hello' });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'provider-failed' } });
    expect(detectionsRepository.save).toHaveBeenLastCalledWith(expect.objectContaining({ error: boom }));
  });

  it.each([
    ['blank text', { text: '   ' }],
    ['missing text', {}],
    ['too long', { text: 'x'.repeat(5001) }],
    ['oversized url', { text: 'Hello', url: `https://e.com/${'x'.repeat(2048)}` }],
  ])('rejects %s with 400', async (_name, body) => {
    const res = await detect(body);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'invalid-input' } });
    expect(detectionsRepository.save).not.toHaveBeenCalled();
  });
});

describe('POST /fix-grammar', () => {
  const fix = (body: unknown, authorization: string | null = `Bearer ${userToken()}`) =>
    app.request('/api/fix-grammar', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
      body: JSON.stringify(body),
    });

  it('returns the corrected text and saves it against the signed-in user', async () => {
    const sub = crypto.randomUUID();
    const res = await fix({ text: 'i has went', url: 'https://teams.microsoft.com/chat' }, `Bearer ${userToken(sub)}`);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ text: 'fixed: i has went', html: 'fixed: i has went', edits: [] });
    expect(correctionsRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        userId: sub,
        request: { text: 'i has went', url: 'https://teams.microsoft.com/chat' },
        result: { text: 'fixed: i has went', html: 'fixed: i has went', edits: [] },
      }),
    );
  });

  it("hands the provider the request's signal, so a cancelled check stops the call", async () => {
    await fix({ text: 'Hello' });

    expect(vi.mocked(fixGrammar).mock.lastCall?.[1]).toBeInstanceOf(AbortSignal);
  });

  it('401s without a user token', async () => {
    const res = await fix({ text: 'Hello' }, null);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'unauthenticated' } });
    expect(correctionsRepository.save).not.toHaveBeenCalled();
  });

  it('400s blank text', async () => {
    const res = await fix({ text: '  ' });

    expect(res.status).toBe(400);
    expect(correctionsRepository.save).not.toHaveBeenCalled();
  });

  it('502s when the provider fails and saves the error', async () => {
    const boom = new Error('provider down');
    vi.mocked(fixGrammar).mockRejectedValueOnce(boom);
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await fix({ text: 'Hello' });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'provider-failed' } });
    expect(correctionsRepository.save).toHaveBeenLastCalledWith(expect.objectContaining({ error: boom }));
  });
});

describe('guardText', () => {
  const post = (path: string, body: unknown) =>
    app.request(`/api${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${userToken()}` },
      body: JSON.stringify(body),
    });

  it.each([
    ['/translate', { text: 'ghbdtn', targetLang: 'en' }, translate],
    ['/detect', { text: 'ghbdtn' }, detectLang],
    ['/rewrite', { text: 'ghbdtn', style: 'formal' }, rewrite],
  ])('422s a mistyped text on %s before the provider call', async (path, body, provider) => {
    vi.mocked(validateGuard).mockResolvedValueOnce('mistyped');
    const res = await post(path, body);

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'mistyped' } });
    expect(provider).not.toHaveBeenCalled();
  });

  it('422s gibberish', async () => {
    vi.mocked(validateGuard).mockResolvedValueOnce('gibberish');
    const res = await post('/translate', { text: 'adfasdf', targetLang: 'en' });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'gibberish' } });
  });

  it('skips the guard on a translate that carries sourceLang', async () => {
    vi.mocked(validateGuard).mockClear();
    const res = await post('/translate', { text: 'Hello', targetLang: 'pl', sourceLang: 'en' });

    expect(res.status).toBe(200);
    expect(validateGuard).not.toHaveBeenCalled();
  });

  it('skips the guard on a fix-grammar marked guarded', async () => {
    vi.mocked(validateGuard).mockClear();
    const res = await post('/fix-grammar', { text: 'Hello', guarded: true });

    expect(res.status).toBe(200);
    expect(validateGuard).not.toHaveBeenCalled();
  });

  it('422s a mistyped fix-grammar from the guard run beside the fix, and aborts the fix', async () => {
    vi.mocked(validateGuard).mockResolvedValueOnce('mistyped');
    const res = await post('/fix-grammar', { text: 'ghbdtn' });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'mistyped' } });
    expect((vi.mocked(fixGrammar).mock.lastCall?.[1] as AbortSignal).aborted).toBe(true);
  });

  it('lets the fix through when the guard itself fails', async () => {
    vi.mocked(validateGuard).mockRejectedValueOnce(new Error('guard down'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await post('/fix-grammar', { text: 'Hello there friend' });

    expect(res.status).toBe(200);
  });

  it('lets the text through when the guard itself fails', async () => {
    vi.mocked(validateGuard).mockRejectedValueOnce(new Error('guard down'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await post('/translate', { text: 'Hello', targetLang: 'pl' });

    expect(res.status).toBe(200);
    expect(translate).toHaveBeenCalled();
  });
});

describe('POST /check', () => {
  const check = (body: unknown, authorization: string | null = `Bearer ${userToken()}`) =>
    app.request('/api/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
      body: JSON.stringify(body),
    });

  it('returns the error count and hands the provider the signal', async () => {
    const res = await check({ text: 'i has went' });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ errors: 2 });
    expect(vi.mocked(grammarQuality).mock.lastCall?.[1]).toBeInstanceOf(AbortSignal);
  });

  it('422s the verdict asked in the same call, without a separate guard call', async () => {
    vi.mocked(validateGuard).mockClear();
    vi.mocked(grammarQuality).mockResolvedValueOnce({ errors: 0, verdict: 'mistyped' });
    const res = await check({ text: 'ghbdtn' });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'mistyped' } });
    expect(validateGuard).not.toHaveBeenCalled();
  });

  it('401s without a user token', async () => {
    expect((await check({ text: 'Hello' }, null)).status).toBe(401);
  });

  it('502s when the provider fails', async () => {
    vi.mocked(grammarQuality).mockRejectedValueOnce(new Error('provider down'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await check({ text: 'Hello' });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'provider-failed' } });
  });
});

describe('POST /rewrite', () => {
  const post = (body: unknown, authorization: string | null = `Bearer ${userToken()}`) =>
    app.request('/api/rewrite', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
      body: JSON.stringify(body),
    });

  it('returns the rewritten text and saves it, style included, against the signed-in user', async () => {
    const sub = crypto.randomUUID();
    const res = await post({ text: 'send report asap', style: 'formal', url: 'https://teams.microsoft.com/chat' }, `Bearer ${userToken(sub)}`);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ text: '[formal] send report asap' });
    expect(rewritesRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        userId: sub,
        request: { text: 'send report asap', style: 'formal', url: 'https://teams.microsoft.com/chat' },
        result: { text: '[formal] send report asap' },
      }),
    );
  });

  it('401s without a user token', async () => {
    const res = await post({ text: 'Hello', style: 'natural' }, null);

    expect(res.status).toBe(401);
    expect(rewritesRepository.save).not.toHaveBeenCalled();
  });

  it.each([undefined, 'poetic', 1])('400s style %s', async (style) => {
    const res = await post({ text: 'Hello', style });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'invalid-input' } });
    expect(rewritesRepository.save).not.toHaveBeenCalled();
  });

  it('502s when the provider fails and saves the error', async () => {
    const boom = new Error('provider down');
    vi.mocked(rewrite).mockRejectedValueOnce(boom);
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await post({ text: 'Hello', style: 'natural' });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'provider-failed' } });
    expect(rewritesRepository.save).toHaveBeenLastCalledWith(expect.objectContaining({ error: boom }));
  });
});

it('404s unknown routes', async () => {
  const res = await app.request('/nope');
  expect(res.status).toBe(404);
  await expect(res.json()).resolves.toMatchObject({ error: { code: 'not-found' } });
});

describe('settings', () => {
  const settings = (init: RequestInit = {}, authorization: string | null = `Bearer ${userToken()}`) =>
    app.request('/api/settings', {
      ...init,
      headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
    });

  it('returns the caller own settings', async () => {
    const sub = crypto.randomUUID();
    const res = await settings({}, `Bearer ${userToken(sub)}`);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ favoriteLanguages: ['en', 'pl'], disabledSites: [] });
    expect(profilesRepository.settings).toHaveBeenCalledWith(sub);
  });

  it('saves and echoes back the new list', async () => {
    const body = JSON.stringify({ favoriteLanguages: ['de', 'uk', 'pl'], disabledSites: ['bank.com'] });
    const res = await settings({ method: 'PUT', body });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ favoriteLanguages: ['de', 'uk', 'pl'], disabledSites: ['bank.com'] });
    expect(profilesRepository.saveSettings).toHaveBeenCalledWith(expect.any(String), {
      favoriteLanguages: ['de', 'uk', 'pl'],
      disabledSites: ['bank.com'],
    });
  });

  it('defaults a missing disabledSites to none', async () => {
    const res = await settings({ method: 'PUT', body: JSON.stringify({ favoriteLanguages: ['de'] }) });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ favoriteLanguages: ['de'], disabledSites: [] });
  });

  it.each([
    ['not an array', { favoriteLanguages: 'de' }],
    ['a missing field', {}],
    ['an invalid code', { favoriteLanguages: ['deutsch!'] }],
    ['a non-string entry', { favoriteLanguages: [42] }],
    ['too many entries', { favoriteLanguages: Array.from({ length: 21 }, () => 'de') }],
    ['disabledSites not an array', { favoriteLanguages: ['de'], disabledSites: 'bank.com' }],
    ['a url in disabledSites', { favoriteLanguages: ['de'], disabledSites: ['https://bank.com/login'] }],
    ['an upper-case hostname', { favoriteLanguages: ['de'], disabledSites: ['Bank.com'] }],
    ['too many sites', { favoriteLanguages: ['de'], disabledSites: Array.from({ length: 101 }, () => 'a.com') }],
  ])('rejects %s with 400', async (_name, body) => {
    const res = await settings({ method: 'PUT', body: JSON.stringify(body) });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'invalid-input' } });
    expect(profilesRepository.saveSettings).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', {}],
    ['PUT', { method: 'PUT', body: JSON.stringify({ favoriteLanguages: ['de'] }) }],
  ])('401s %s without a token', async (_name, init) => {
    const res = await settings(init, null);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'unauthenticated' } });
  });
});

describe('POST /transcribe', () => {
  const upload = (audio: File | null, authorization: string | null = `Bearer ${userToken()}`) => {
    const form = new FormData();
    if (audio) form.set('audio', audio);
    return app.request('/api/transcribe', { method: 'POST', headers: authorization ? { authorization } : {}, body: form });
  };
  const webm = (bytes = 3) => new File([new Uint8Array(bytes)], 'a.webm', { type: 'audio/webm' });

  it('returns the text and its language, and saves nothing (switched off for now)', async () => {
    const res = await upload(webm());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: 'hello there', lang: 'en', model: 'm' });
    expect(detectLang).toHaveBeenCalledWith({ text: 'hello there' });
    expect(transcriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('skips detection when nothing was heard', async () => {
    vi.mocked(transcribe).mockResolvedValueOnce({ text: '', model: 'm' });
    expect(await (await upload(webm())).json()).toMatchObject({ text: '', lang: 'und' });
    expect(detectLang).not.toHaveBeenCalled();
  });

  it('401s without a token', async () => {
    expect((await upload(webm(), null)).status).toBe(401);
  });

  it('502s when the provider fails', async () => {
    vi.mocked(transcribe).mockRejectedValueOnce(new Error('boom'));
    expect((await upload(webm())).status).toBe(502);
    expect(transcriptionsRepository.save).not.toHaveBeenCalled();
  });

  it.each([
    ['no audio', null],
    ['not audio', new File(['x'], 'a.txt', { type: 'text/plain' })],
    ['empty audio', webm(0)],
    ['too big', webm(5 * 1024 * 1024 + 1)],
  ])('400s on %s', async (_, audio) => {
    expect((await upload(audio)).status).toBe(400);
    expect(transcribe).not.toHaveBeenCalled();
  });
});

describe('POST /voice-session', () => {
  const mint = (authorization: string | null = `Bearer ${userToken()}`) =>
    app.request('/api/voice-session', { method: 'POST', headers: authorization ? { authorization } : {} });

  it('returns a client secret for a live transcription session', async () => {
    const res = await mint();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ secret: 'ek_test', expiresAt: 1, model: 'm' });
  });

  it('401s without a token', async () => {
    expect((await mint(null)).status).toBe(401);
    expect(voiceSession).not.toHaveBeenCalled();
  });

  it('502s when the provider fails', async () => {
    vi.mocked(voiceSession).mockRejectedValueOnce(new Error('boom'));
    expect((await mint()).status).toBe(502);
  });
});

describe('GET /stats', () => {
  it('returns the word counts', async () => {
    const res = await app.request('/api/stats', { headers: { authorization: `Bearer ${userToken()}` } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 3, byDay: { '2026-10-01': 3 }, dictationSeconds: { total: 9.5, byDay: { '2026-10-01': 9.5 } } });
  });

  it('401s without a token', async () => {
    expect((await app.request('/api/stats')).status).toBe(401);
  });

  it('counts the words of a successful translation, and never fails it', async () => {
    vi.mocked(wordStatsRepository.add).mockImplementationOnce(() => { throw new Error('read-only disk'); });
    const res = await post({ text: 'Hello there', targetLang: 'pl' });
    expect(res.status).toBe(200);
    expect(wordStatsRepository.add).toHaveBeenCalledWith('Hello there');
  });
});

describe('POST /stats/dictation', () => {
  const report = (body: unknown, authorization: string | null = `Bearer ${userToken()}`) =>
    app.request('/api/stats/dictation', { method: 'POST', headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) }, body: JSON.stringify(body) });

  it("adds one recording's seconds, words and model", async () => {
    expect((await report({ seconds: 7.4, words: 18, model: 'gpt-live-transcribe' })).status).toBe(204);
    expect(wordStatsRepository.addDictation).toHaveBeenCalledWith(7.4, 18, 'gpt-live-transcribe');
  });

  it('takes a report without words or model (transcribing failed)', async () => {
    expect((await report({ seconds: 2 })).status).toBe(204);
    expect(wordStatsRepository.addDictation).toHaveBeenCalledWith(2, undefined, undefined);
  });

  it('answers 204 even when the counter cannot write', async () => {
    vi.mocked(wordStatsRepository.addDictation).mockImplementationOnce(() => { throw new Error('read-only disk'); });
    expect((await report({ seconds: 3 })).status).toBe(204);
  });

  it('401s without a token', async () => {
    expect((await report({ seconds: 3 }, null)).status).toBe(401);
  });

  it.each([[{}], [{ seconds: 0 }], [{ seconds: -1 }], [{ seconds: 601 }], [{ seconds: '5' }], [{ seconds: 5, words: 1.5 }], [{ seconds: 5, words: -1 }], [{ seconds: 5, words: 10_001 }], [{ seconds: 5, model: 7 }], [{ seconds: 5, model: 'x'.repeat(65) }], [{ seconds: 5, model: 'a b' }]])('400s on %j', async (body) => {
    expect((await report(body)).status).toBe(400);
    expect(wordStatsRepository.addDictation).not.toHaveBeenCalled();
  });
});
