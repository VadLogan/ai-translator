import { expect, it } from 'vitest';
import { toRow } from './detections.ts';

const request = { text: 'hi' };
const userId = '11111111-2222-3333-4444-555555555555';

it('maps a success to a row', () => {
  const result = {
    lang: 'en',
    model: 'gpt-5.6-luna-2026-05-01',
    usage: { inputTokens: 12, outputTokens: 1, totalTokens: 13 },
  };
  expect(toRow({ id: 'x', userId, request: { ...request, url: 'https://example.com/page' }, result, durationMs: 42 })).toEqual({
    id: 'x', user_id: userId, text: 'hi', url: 'https://example.com/page',
    lang: 'en', model: 'gpt-5.6-luna-2026-05-01',
    input_tokens: 12, output_tokens: 1, total_tokens: 13,
    duration_ms: 42, error: null,
  });
});

it('maps a failure to a row with the error and no language', () => {
  const row = toRow({ id: 'x', userId, request, error: new Error('401'), durationMs: 5 });
  expect(row).toMatchObject({ lang: null, error: 'Error: 401' });
});

it('never writes verified -- only POST /translate knows whether the detection was right', () => {
  expect(toRow({ id: 'x', userId, request, result: { lang: 'en' }, durationMs: 5 })).not.toHaveProperty('verified');
});

it('leaves url, model and token counts null when the request and provider omit them', () => {
  const row = toRow({ id: 'x', userId, request, result: { lang: 'en' }, durationMs: 5 });
  expect(row).toMatchObject({ url: null, model: null, input_tokens: null, output_tokens: null, total_tokens: null });
});
