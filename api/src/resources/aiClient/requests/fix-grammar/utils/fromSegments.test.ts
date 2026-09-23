import { expect, it } from 'vitest';
import { fromSegments } from './fromSegments.ts';

it('joins the corrected text and wraps each edit in a span', () => {
  expect(
    fromSegments([
      { text: 'I', original: 'i' },
      { text: ' ', original: null },
      { text: 'went', original: 'has went' },
      { text: ' home', original: null },
      { text: '.', original: '' },
    ]),
  ).toEqual({
    text: 'I went home.',
    html: '<span class="fix" data-original="i">I</span> <span class="fix" data-original="has went">went</span> home<span class="fix" data-original="">.</span>',
  });
});

it('escapes user text so it cannot inject markup', () => {
  const { html } = fromSegments([
    { text: '<b>a</b> & ', original: null },
    { text: 'x', original: '"><img>' },
  ]);
  expect(html).toBe('&#60;b&#62;a&#60;/b&#62; &#38; <span class="fix" data-original="&#34;&#62;&#60;img&#62;">x</span>');
});

it('keeps a deletion as an empty span, so the removed text is still shown', () => {
  expect(fromSegments([{ text: 'ok', original: null }, { text: '', original: '!!' }])).toEqual({
    text: 'ok',
    html: 'ok<span class="fix" data-original="!!"></span>',
  });
});

it('returns empty text and html for no segments', () => {
  expect(fromSegments([])).toEqual({ text: '', html: '' });
});
