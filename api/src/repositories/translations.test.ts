import { expect, it } from 'vitest';
import { toRow } from './translations.ts';

const request = { text: 'hi', targetLang: 'de' };

it('maps a success to a row', () => {
  const result = { text: 'Hallo', detectedSourceLang: 'en', usage: { inputTokens: 12, outputTokens: 3, totalTokens: 15 } };
  expect(toRow({ id: 'x', request: { ...request, url: 'https://example.com/page' }, result, durationMs: 42 })).toEqual({
    id: 'x', text: 'hi', target_lang: 'de', source_lang: null, url: 'https://example.com/page',
    result: 'Hallo', detected_source_lang: 'en',
    input_tokens: 12, output_tokens: 3, total_tokens: 15,
    duration_ms: 42, error: null,
  });
});

it('maps a failure to a row with the error and no result', () => {
  const row = toRow({ id: 'x', request: { ...request, sourceLang: 'en' }, error: new Error('401'), durationMs: 5 });
  expect(row).toMatchObject({ source_lang: 'en', result: null, detected_source_lang: null, error: 'Error: 401' });
});

it('leaves url and token counts null when the request and provider omit them', () => {
  const row = toRow({ id: 'x', request, result: { text: 'Hallo' }, durationMs: 5 });
  expect(row).toMatchObject({ url: null, input_tokens: null, output_tokens: null, total_tokens: null });
});
