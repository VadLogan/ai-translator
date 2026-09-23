import { expect, it } from 'vitest';
import { toRow } from './rewrites.ts';

const request = { text: 'hey send report asap', style: 'formal' as const };
const userId = '11111111-2222-3333-4444-555555555555';

it('maps a success to a row, style included', () => {
  const result = {
    text: 'Could you please send the report at your earliest convenience?',
    model: 'gpt-5.6-luna-2026-05-01',
    usage: { inputTokens: 12, outputTokens: 11, totalTokens: 23 },
  };
  expect(toRow({ id: 'x', userId, request: { ...request, url: 'https://example.com/page' }, result, durationMs: 42 })).toEqual({
    id: 'x', user_id: userId, text: 'hey send report asap', style: 'formal', url: 'https://example.com/page',
    result: result.text, model: 'gpt-5.6-luna-2026-05-01',
    input_tokens: 12, output_tokens: 11, total_tokens: 23,
    duration_ms: 42, error: null,
  });
});

it('maps a failure to a row with the error and no result', () => {
  const row = toRow({ id: 'x', userId, request, error: new Error('401'), durationMs: 5 });
  expect(row).toMatchObject({ style: 'formal', url: null, result: null, model: null, input_tokens: null, error: 'Error: 401' });
});
