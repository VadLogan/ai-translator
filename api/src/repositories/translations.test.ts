import { expect, it } from 'vitest';
import { toRow } from './translations.ts';

const request = { text: 'hi', targetLang: 'de' };

it('maps a success to a row', () => {
  expect(toRow({ id: 'x', request, result: { text: 'Hallo', detectedSourceLang: 'en' }, durationMs: 42 })).toEqual({
    id: 'x', text: 'hi', target_lang: 'de', source_lang: null,
    result: 'Hallo', detected_source_lang: 'en', duration_ms: 42, error: null,
  });
});

it('maps a failure to a row with the error and no result', () => {
  const row = toRow({ id: 'x', request: { ...request, sourceLang: 'en' }, error: new Error('401'), durationMs: 5 });
  expect(row).toMatchObject({ source_lang: 'en', result: null, detected_source_lang: null, error: 'Error: 401' });
});
