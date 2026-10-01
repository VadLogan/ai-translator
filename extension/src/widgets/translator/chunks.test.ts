import { expect, it } from 'vitest';
import type { FixGrammarOk } from '../../../../shared/contract';
import { carryOver, cleanFix, fixOf, isBeingTyped, isFinished, mergeFixes, splitChunks, splitSentences, type Chunk } from './chunks';
import { applyEdits } from './state';

it('cuts paragraphs, trimmed, with their field offsets, and leaves out short ones', () => {
  const text = '  i has went home.\n\nok\nshe dont like it  ';
  expect(splitChunks(text)).toEqual([
    { start: 2, text: 'i has went home.' },
    { start: 23, text: 'she dont like it' },
  ]);
  for (const c of splitChunks(text)) expect(text.slice(c.start, c.start + c.text.length)).toBe(c.text);
});

it('cuts a paragraph over 600 chars at sentence boundaries', () => {
  const sentence = 'This sentence has exactly some words in it. ';
  const text = sentence.repeat(30);
  const chunks = splitChunks(text);
  expect(chunks.length).toBeGreaterThan(1);
  for (const c of chunks) {
    expect(c.text.length).toBeLessThanOrEqual(600);
    expect(text.slice(c.start, c.start + c.text.length)).toBe(c.text);
    expect(isFinished(c.text)).toBe(true);
  }
});

it('tells a finished sentence from one being typed', () => {
  expect(isFinished('I went home.')).toBe(true);
  expect(isFinished('He said "go!"')).toBe(true);
  expect(isFinished('I went hom')).toBe(false);
});

it('merges chunk fixes into one field-wide fix whose edits round-trip', () => {
  const text = 'i has went.\n\nshe dont <b> it.';
  const [a, b] = splitChunks(text) as [Chunk, Chunk];
  const fixA: FixGrammarOk = {
    text: 'I went.',
    html: '<span class="fix">I went</span>.',
    edits: [{ start: 0, end: 10, original: 'i has went', replacement: 'I went', kind: 'error', reason: '' }],
  };
  const fixB: FixGrammarOk = {
    text: "she doesn't <b> it.",
    html: '…',
    edits: [{ start: 4, end: 8, original: 'dont', replacement: "doesn't", kind: 'error', reason: '' }],
  };
  const merged = mergeFixes(text, [
    { chunk: a, fix: fixA },
    { chunk: b, fix: fixB },
  ]);
  expect(merged.edits.map((e) => text.slice(e.start, e.end))).toEqual(['i has went', 'dont']);
  expect(applyEdits(text, merged.edits)).toBe(merged.text);
  expect(merged.text).toBe("I went.\n\nshe doesn't <b> it.");
  expect(merged.html).toBe('<span class="fix">I went</span>.\n\n…');
});

it('cuts a chunk into sentences with field offsets, a short one joining its neighbour', () => {
  const text = 'Intro.\nYes. I has went home. She dont know. Ok then.';
  const [, chunk] = [null, ...splitChunks(text)] as [null, Chunk];
  const sentences = splitSentences(chunk);
  expect(sentences.map((s) => s.text)).toEqual(['Yes. I has went home.', 'She dont know. Ok then.']);
  for (const s of sentences) expect(text.slice(s.start, s.start + s.text.length)).toBe(s.text);
});

it('makes a clean fix that merges like any other', () => {
  const text = 'All is fine <here>.';
  const [chunk] = splitChunks(text) as [Chunk];
  expect(mergeFixes(text, [{ chunk, fix: cleanFix(chunk.text) }])).toEqual({ text, html: 'All is fine &#60;here&#62;.', edits: [] });
});

const edit = (text: string, original: string, replacement: string) => {
  const start = text.indexOf(original);
  return { start, end: start + original.length, original, replacement, kind: 'error' as const, reason: '' };
};

it('carries an earlier fix over to an edited paragraph, outside the changed words', () => {
  const old = 'I has went home. She dont know it.';
  const fix = fixOf(old, [edit(old, 'has went', 'went'), edit(old, 'dont', "doesn't")]);
  // A sentence typed on at the end: both edits stay where they were.
  const longer = `${old} We was late.`;
  expect(carryOver(longer, { text: old, fix })?.edits.map((e) => longer.slice(e.start, e.end))).toEqual(['has went', 'dont']);
  // A sentence added right after an edited word: that edit stays too.
  const ending = 'I has went home';
  const endFix = fixOf(ending, [edit(ending, 'home', 'home.')]);
  expect(carryOver(`${ending} and she dont know.`, { text: ending, fix: endFix })?.edits.map((e) => e.original)).toEqual(['home']);
  // Typing on into that word: it is a different word now, its edit goes.
  expect(carryOver(`${ending}work is done.`, { text: ending, fix: endFix })?.edits).toEqual([]);
  // A word before the second edit changed: the first stays, the second shifts.
  const edited = 'I has went home. Then she dont know it.';
  const carried = carryOver(edited, { text: old, fix })!;
  expect(carried.edits.map((e) => edited.slice(e.start, e.end))).toEqual(['has went', 'dont']);
  expect(carried.text).toBe(applyEdits(edited, carried.edits));
  // The edited word itself: its edit is dropped.
  const retyped = 'I has went home. She doesnt know it.';
  expect(carryOver(retyped, { text: old, fix })?.edits.map((e) => e.original)).toEqual(['has went']);
});

it('carries nothing over between unrelated texts', () => {
  const old = 'I has went home today.';
  expect(carryOver('Completely different words here.', { text: old, fix: fixOf(old, [edit(old, 'has went', 'went')]) })).toBeNull();
});

it('builds html the way the API does', () => {
  const text = 'a <b> dont';
  expect(fixOf(text, [edit(text, 'dont', "don't")]).html).toBe('a &#60;b&#62; <span class="fix" data-original="dont">don&#39;t</span>');
});

it('keeps a short sentence being typed apart from the ended one before it', () => {
  const text = 'I went home today. My';
  expect(splitSentences(splitChunks(text)[0]!).map((s) => s.text)).toEqual(['I went home today.', 'My']);
});

it('tells the sentence being typed, a trailing space included', () => {
  const text = 'I went home. My brother dont ';
  const [done, typing] = splitSentences(splitChunks(text)[0]!) as [Chunk, Chunk];
  expect(isBeingTyped(text, typing, text.length)).toBe(true); // caret after the space
  expect(isBeingTyped(text, done, text.length)).toBe(false); // ended
  expect(isBeingTyped(text, typing, null)).toBe(false); // typing finished
  expect(isBeingTyped(text, typing, 3)).toBe(false); // caret in an earlier sentence: that one is
  expect(isBeingTyped(text, done, 3)).toBe(true); // editing the middle of an ended sentence
  expect(isBeingTyped(text, done, done.start + done.text.length)).toBe(false); // right after its full stop: just finished
});
