import { expect, it } from 'vitest';
import { toRow } from './transcriptions.ts';

const userId = '11111111-2222-3333-4444-555555555555';
const audio = new File([new Uint8Array(3)], 'a.webm', { type: 'audio/webm' });

it('maps a success to a row with the audio metadata, never the audio', () => {
  expect(toRow({ id: 'x', userId, request: { audio, url: 'https://example.com' }, result: { text: 'hi', lang: 'en', model: 'm' }, durationMs: 9 })).toEqual({
    id: 'x', user_id: userId, url: 'https://example.com', mime_type: 'audio/webm', audio_bytes: 3,
    text: 'hi', lang: 'en', model: 'm', duration_ms: 9, error: null,
  });
});

it('maps a failure to a row with the error and no text', () => {
  expect(toRow({ id: 'x', userId, request: { audio }, error: new Error('401'), durationMs: 5 })).toMatchObject({ url: null, text: null, lang: null, error: 'Error: 401' });
});
