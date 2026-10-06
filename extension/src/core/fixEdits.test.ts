import { describe, expect, it } from 'vitest';
import type { FixEdit, FixGrammarOk } from '../../../shared/contract';
import { sentenceAt, spliceFix } from './fixEdits';

const edit = (text: string, original: string, replacement: string, from = 0): FixEdit => {
  const start = text.indexOf(original, from);
  return { start, end: start + original.length, original, replacement, kind: 'error', reason: '' };
};

describe('sentenceAt', () => {
  const text = 'I has a cat. She like milk.  We goes home.';

  it('finds the sentence holding the range, trimmed', () => {
    expect(sentenceAt(text, text.indexOf('like'))).toEqual({ start: 13, text: 'She like milk.' });
    expect(sentenceAt(text, text.indexOf('goes'))).toEqual({ start: 29, text: 'We goes home.' });
  });

  it('widens to whole sentences when the range crosses an end', () => {
    expect(sentenceAt(text, text.indexOf('cat'), text.indexOf('like'))).toEqual({ start: 0, text: 'I has a cat. She like milk.' });
  });
});

describe('spliceFix', () => {
  const text = 'I has a cat. She like milk.';
  const fix: FixGrammarOk = {
    text: 'I have a cat. She likes the milk.',
    html: '',
    edits: [edit(text, 'has', 'have'), edit(text, 'like milk', 'likes the milk')],
  };

  it('swaps the sentence edits for the re-check, keeping the rest', () => {
    const sentence = sentenceAt(text, text.indexOf('like'));
    const again: FixGrammarOk = { text: 'She likes milk.', html: '', edits: [edit(sentence.text, 'like', 'likes')] };
    const out = spliceFix(text, fix, sentence, again);
    expect(out.text).toBe('I have a cat. She likes milk.');
    expect(out.edits.map((e) => [text.slice(e.start, e.end), e.replacement])).toEqual([['has', 'have'], ['like', 'likes']]);
    expect(out.html).toBe('I <span class="fix" data-original="has">have</span> a cat. She <span class="fix" data-original="like">likes</span> milk.');
  });

  it('a clean re-check drops the sentence edits', () => {
    const sentence = sentenceAt(text, text.indexOf('like'));
    const out = spliceFix(text, fix, sentence, { text: sentence.text, html: sentence.text, edits: [] });
    expect(out.edits).toHaveLength(1);
    expect(out.text).toBe('I have a cat. She like milk.');
  });
});
