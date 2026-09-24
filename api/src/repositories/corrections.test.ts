import { expect, it } from 'vitest';
import { toRow } from './corrections.ts';

const request = { text: 'i has went' };
const userId = '11111111-2222-3333-4444-555555555555';

it('maps a success to a row', () => {
  const result = {
    text: 'I went',
    html: '<span class="fix" data-original="i has went">I went</span>',
    mistyped: false, gibberish: false,
    model: 'gpt-5.6-luna-2026-05-01',
    usage: { inputTokens: 12, outputTokens: 3, totalTokens: 15 },
  };
  expect(toRow({ id: 'x', userId, request: { ...request, url: 'https://example.com/page' }, result, durationMs: 42 })).toEqual({
    id: 'x', user_id: userId, text: 'i has went', url: 'https://example.com/page',
    result: 'I went', model: 'gpt-5.6-luna-2026-05-01',
    input_tokens: 12, output_tokens: 3, total_tokens: 15,
    duration_ms: 42, error: null,
  });
});

it('maps a failure to a row with the error and no result', () => {
  const row = toRow({ id: 'x', userId, request, error: new Error('401'), durationMs: 5 });
  expect(row).toMatchObject({ url: null, result: null, model: null, input_tokens: null, error: 'Error: 401' });
});
