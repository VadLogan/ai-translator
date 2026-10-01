import { expect, it } from 'vitest';
import { applyEdits } from './applyEdits.ts';

it('applies edits in order, each searched after the previous one', () => {
  const text = 'i has went to the shop and the shop was close';
  expect(
    applyEdits(text, [
      { original: 'i has went', replacement: 'I went' },
      { original: 'the shop was close', replacement: 'the shop was closed.' },
    ]),
  ).toBe('I went to the shop and the shop was closed.');
});

it('drops an edit whose original is not in the text, or is empty', () => {
  expect(
    applyEdits('teh cat', [
      { original: 'dog', replacement: 'cat' },
      { original: '', replacement: 'x' },
      { original: 'teh', replacement: 'the' },
    ]),
  ).toBe('the cat');
});

it('returns the text unchanged with no edits', () => {
  expect(applyEdits('Fine.', [])).toBe('Fine.');
});
