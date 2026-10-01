import { expect, it } from 'vitest';
import { applyEvent, emptyTranscript, isComplete, liveText } from './liveTranscript';

const run = (events: Parameters<typeof applyEvent>[1][]) => events.reduce(applyEvent, emptyTranscript());

it('grows with the deltas, before the item is even committed (no turn detection)', () => {
  const state = run([
    { type: 'conversation.item.input_audio_transcription.delta', item_id: 'a', delta: 'I' },
    { type: 'conversation.item.input_audio_transcription.delta', item_id: 'a', delta: ' have' },
  ]);
  expect(liveText(state)).toBe('I have');
  expect(isComplete(state)).toBe(false);
});

it("takes an item's completed transcript over its deltas, and joins items in order", () => {
  const state = run([
    { type: 'input_audio_buffer.committed', item_id: 'a' },
    { type: 'conversation.item.input_audio_transcription.delta', item_id: 'b', delta: 'second' },
    { type: 'conversation.item.input_audio_transcription.delta', item_id: 'a', delta: 'firs' },
    { type: 'conversation.item.input_audio_transcription.completed', item_id: 'a', transcript: 'First.' },
  ]);
  expect(liveText(state)).toBe('First. second');
  expect(isComplete(state)).toBe(false);
  expect(isComplete(applyEvent(state, { type: 'conversation.item.input_audio_transcription.completed', item_id: 'b', transcript: 'Second.' }))).toBe(true);
});

it('is never complete after an error, or with nothing heard', () => {
  expect(isComplete(emptyTranscript())).toBe(false);
  const state = run([
    { type: 'conversation.item.input_audio_transcription.completed', item_id: 'a', transcript: 'Hi.' },
    { type: 'error' },
  ]);
  expect(isComplete(state)).toBe(false);
});
