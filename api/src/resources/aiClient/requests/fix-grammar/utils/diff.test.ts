import { expect, it } from 'vitest';
import { diff } from './diff.ts';

it('diffs down to single words and punctuation marks, and round-trips both texts', () => {
  const input = 'i has went to shop yesterday and buyed two apple';
  const corrected = 'I went to the shop yesterday and bought two apples.';
  const segments = diff(input, corrected);

  expect(segments.filter((s) => s.original !== null)).toEqual([
    { text: 'I ', original: 'i has ' }, // two edits one space apart become one range
    { text: 'the ', original: '' },
    { text: 'bought', original: 'buyed' },
    { text: 'apples.', original: 'apple' },
  ]);
  expect(segments.map((s) => s.original ?? s.text).join('')).toBe(input);
  expect(segments.map((s) => s.text).join('')).toBe(corrected);
});

it('merges adjacent changed words into one range', () => {
  expect(diff('he go quick home', 'he quickly went home')).toEqual([
    { text: 'he ', original: null },
    { text: 'quickly went', original: 'go quick' },
    { text: ' home', original: null },
  ]);
});

it('returns one unchanged segment when nothing changed', () => {
  expect(diff('Fine, thanks.', 'Fine, thanks.')).toEqual([{ text: 'Fine, thanks.', original: null }]);
});

it('does not merge edits separated by a word', () => {
  expect(diff('a b c', 'x b y').filter((s) => s.original !== null)).toEqual([
    { text: 'x', original: 'a' },
    { text: 'y', original: 'c' },
  ]);
});

it('treats a punctuation mark as its own edit', () => {
  expect(diff('Hello world', 'Hello, world')).toEqual([
    { text: 'Hello', original: null },
    { text: ',', original: '' },
    { text: ' world', original: null },
  ]);
});

it('handles non-Latin text and empty sides', () => {
  expect(diff('я пішов додому', 'я пішла додому')).toEqual([
    { text: 'я ', original: null },
    { text: 'пішла', original: 'пішов' },
    { text: ' додому', original: null },
  ]);
  expect(diff('', 'new')).toEqual([{ text: 'new', original: '' }]);
  expect(diff('old', '')).toEqual([{ text: '', original: 'old' }]);
  expect(diff('', '')).toEqual([]);
});
