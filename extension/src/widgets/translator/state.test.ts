import { expect, it } from 'vitest';
import { answered, applyEdits, badge, cleanCheck, countFixes, showsUnderlines, visibleEdits, withoutEdit, grammarCount, hasEnoughWords, isChecking, isMistyped, detectedLang, hidden, isMenuOpen, menuLanguages, menuShortcuts, pairTarget, reducer } from './state';
import type { EditableSelection } from '../../content/selection';
import { findLanguage } from '../../core/languages';

const selection = { text: 'hello' } as EditableSelection;
const anchor = { x: 1, top: 2, bottom: 3 };

it('walks icon → menu → detected → close', () => {
  let state = reducer(hidden, { type: 'select', selection, anchor });
  expect(state.screen).toEqual({ kind: 'icon', field: undefined });
  expect(isMenuOpen(state)).toBe(false);

  state = reducer(state, { type: 'open', languages: [findLanguage('de')!], pairs: [] });
  expect(isMenuOpen(state)).toBe(true);

  state = reducer(state, { type: 'detected', detection: { lang: 'en' } });
  expect(detectedLang(state)).toBe('en');
  expect(detectedLang(reducer(state, { type: 'detected', detection: 'mistyped' }))).toBeUndefined();

  expect(reducer(state, { type: 'close' })).toEqual(hidden);
});

it('a new selection drops the previous detection', () => {
  const detected = { ...reducer(hidden, { type: 'select', selection, anchor }), detection: { lang: 'en' } };
  expect(reducer(detected, { type: 'select', selection, anchor }).detection).toBeNull();
});

it('ignores screens that arrive after closing', () => {
  expect(reducer(hidden, { type: 'show', screen: { kind: 'busy', label: 'Translating…' } })).toBe(hidden);
});

it('a focused field gets the corner icon, which is not an open menu', () => {
  const state = reducer(hidden, { type: 'select', selection, anchor, field: true });
  expect(state.screen).toEqual({ kind: 'icon', field: true });
  expect(isMenuOpen(state)).toBe(false);
});

const edit = (start: number, original: string, replacement: string, kind: 'error' | 'native' = 'error') => ({ start, end: start + original.length, original, replacement, kind, reason: '' });
// 'I has gone home' → 'I have gone home.'
const fix = {
  text: 'I have gone home.',
  html: 'I <span class="fix" data-original="has">have</span> gone <span class="fix" data-original="home">home.</span>',
  edits: [edit(2, 'has', 'have'), edit(11, 'home', 'home.')],
};

it('counts one error per edit', () => {
  expect(countFixes(fix)).toBe(2);
  expect(countFixes({ text: 'ok', html: 'ok', edits: [] })).toBe(0);
});

it('applies edits right to left, so earlier offsets hold', () => {
  expect(applyEdits('I has gone home', fix.edits)).toBe('I have gone home.');
  expect(applyEdits('I has gone home', [fix.edits[1]!])).toBe('I has gone home.');
});

it('rebases the check after one edit is replaced in the field', () => {
  const next = withoutEdit({ text: 'I has gone home', errors: 2, fix }, fix.edits[0]!);
  expect(next.text).toBe('I have gone home');
  expect(next.errors).toBe(1);
  expect(next.fix?.edits).toEqual([edit(12, 'home', 'home.')]);
  expect(next.fix?.html).toBe('I have gone <span class="fix" data-original="home">home.</span>');
  // The shifted edit still points at its words in the new text.
  expect(next.text.slice(12, 16)).toBe('home');
});

it('underlines only a multi-line field whose fix matches its text, minus ignored edits', () => {
  const element = { localName: 'textarea' } as HTMLElement;
  const field = { kind: 'text-control', text: 'I has gone home', element } as unknown as EditableSelection;
  let state = reducer(hidden, { type: 'select', selection: field, anchor, field: true });
  state = reducer(state, { type: 'checked', check: { text: 'I has gone home', errors: 2, fix } });
  expect(showsUnderlines(state)).toBe(true);
  // Typed on: the fix is stale.
  expect(showsUnderlines(reducer(state, { type: 'select', selection: { ...field, text: 'I has gone home!' } as EditableSelection, anchor, field: true }))).toBe(false);
  // A single-line input never gets them.
  const input = { ...field, element: { localName: 'input' } } as unknown as EditableSelection;
  expect(showsUnderlines(reducer(state, { type: 'select', selection: input, anchor, field: true }))).toBe(false);

  state = reducer(state, { type: 'ignore', edit: fix.edits[0]! });
  expect(visibleEdits(state)).toEqual([fix.edits[1]]);
  // Survives closing and re-selecting the same field; another field starts clean.
  state = reducer(reducer(state, { type: 'close' }), { type: 'select', selection: field, anchor, field: true });
  expect(visibleEdits(state)).toEqual([fix.edits[1]]);
  const other = { ...field, element: { localName: 'textarea' } } as unknown as EditableSelection;
  expect(visibleEdits(reducer(state, { type: 'select', selection: other, anchor, field: true }))).toHaveLength(2);
});

it('keeps underlines under a hover-opened grammar panel only, and steps past ignored edits', () => {
  const field = { kind: 'text-control', text: 'I has gone home', element: { localName: 'textarea' } } as unknown as EditableSelection;
  let state = reducer(hidden, { type: 'select', selection: field, anchor, field: true });
  state = reducer(state, { type: 'checked', check: { text: 'I has gone home', errors: 2, fix } });
  const panel = { kind: 'grammar', fix, index: 1, base: 0, field: true } as const;
  expect(showsUnderlines(reducer(state, { type: 'show', screen: panel }))).toBe(false);
  state = reducer(state, { type: 'show', screen: { ...panel, hover: true } });
  expect(showsUnderlines(state)).toBe(true);
  // Ignoring the last edit shown moves back onto the one left; ignoring that one closes to the field icon.
  state = reducer(state, { type: 'ignore', edit: fix.edits[1]! });
  expect(state.screen).toMatchObject({ kind: 'grammar', index: 0 });
  state = reducer(state, { type: 'ignore', edit: fix.edits[0]! });
  expect(state.screen).toEqual({ kind: 'icon', field: true });
});

it('badges the field icon only while the check matches the text', () => {
  let state = reducer(hidden, { type: 'select', selection, anchor, field: true });
  state = reducer(state, { type: 'checked', check: { text: 'hello', errors: 1 } });
  expect(badge(state)).toBe(1);

  // Same field, same text: the next keyup's re-select keeps the check.
  expect(badge(reducer(state, { type: 'select', selection, anchor, field: true }))).toBe(1);
  // Same field, new text: kept but hidden until the next check.
  const typed = { ...selection, text: 'hello!' } as EditableSelection;
  expect(badge(reducer(state, { type: 'select', selection: typed, anchor, field: true }))).toBeUndefined();
  // Another field with the same text: the same answer.
  const other = { text: 'hello', element: {} } as EditableSelection;
  expect(badge(reducer(state, { type: 'select', selection: other, anchor, field: true }))).toBe(1);
  // Closing keeps it, so clicking back into the field doesn't ask again.
  expect(badge(reducer(reducer(state, { type: 'close' }), { type: 'select', selection, anchor, field: true }))).toBe(1);
});

it('badges a failed check as an error, not as checking', () => {
  let state = reducer(hidden, { type: 'select', selection, anchor, field: true });
  state = reducer(state, { type: 'checked', check: { text: 'hello', error: { message: 'Rate limited' } } });
  expect(badge(state)).toBe('error');
  expect(isChecking(state)).toBe(false);
});

it('spins while the check is in flight, then badges', () => {
  let state = reducer(hidden, { type: 'select', selection, anchor, field: true });
  state = reducer(state, { type: 'checked', check: { text: 'hello' } });
  expect(isChecking(state)).toBe(true);
  expect(badge(state)).toBeUndefined();

  state = reducer(state, { type: 'checked', check: { text: 'hello', errors: 1 } });
  expect(isChecking(state)).toBe(false);
  expect(badge(state)).toBe(1);
});

it('leaves the detected language out of the targets', () => {
  const de = findLanguage('de')!;
  const en = findLanguage('en')!;
  let state = reducer(reducer(hidden, { type: 'select', selection, anchor }), { type: 'open', languages: [en, de], pairs: [] });
  expect(menuLanguages(state)).toEqual([en, de]);
  state = reducer(state, { type: 'detected', detection: { lang: 'en' } });
  expect(menuLanguages(state)).toEqual([de]);
});

it("suggests the usual pair's target for the detected language and leaves it out of the list", () => {
  const [pl, uk, en] = ['pl', 'uk', 'en'].map((code) => findLanguage(code)!);
  const pairs = [{ from: 'pl', to: 'uk' }, { from: 'uk', to: 'en' }];
  let state = reducer(reducer(hidden, { type: 'select', selection, anchor }), { type: 'open', languages: [uk!, en!, pl!], pairs });
  expect(pairTarget(state)).toBeUndefined();
  state = reducer(state, { type: 'detected', detection: { lang: 'pl' } });
  expect(pairTarget(state)).toBe('uk');
  expect(menuLanguages(state)).toEqual([en]);
  expect(menuShortcuts(state)).toEqual(['uk', 'en']);
  // A pair starting from the detected language wins over one ending in it.
  expect(pairTarget({ ...state, detection: { lang: 'uk' } })).toBe('en');
  // Only one ending in it: flipped.
  expect(pairTarget({ ...state, pairs: [pairs[0]!], detection: { lang: 'uk' } })).toBe('pl');
  expect(pairTarget({ ...state, detection: 'unknown' })).toBeUndefined();
});

it("page text shows the pair's target translated, not as a shortcut; a pick swaps which language is left out", () => {
  const [pl, uk, en] = ['pl', 'uk', 'en'].map((code) => findLanguage(code)!);
  const page = { ...selection, kind: 'page' } as EditableSelection;
  let state = reducer(reducer(hidden, { type: 'select', selection: page, anchor }), { type: 'open', languages: [uk!, en!, pl!], pairs: [{ from: 'pl', to: 'uk' }] });
  state = reducer(state, { type: 'detected', detection: { lang: 'pl' } });
  expect(menuShortcuts(state)).toEqual(['en']);
  state = reducer(state, { type: 'translation', translation: { lang: 'en' } });
  expect(menuLanguages(state)).toEqual([uk]);
  expect(reducer(state, { type: 'close' }).translation).toBeNull();
});

it('counts the grammar fixes of the selected text only', () => {
  const state = reducer(hidden, { type: 'select', selection, anchor });
  expect(grammarCount(state)).toBeUndefined();
  expect(grammarCount(reducer(state, { type: 'checked', check: { text: 'hello' } }))).toBe('checking');
  const done = reducer(state, { type: 'checked', check: { text: 'hello', errors: 1 } });
  expect(grammarCount(done)).toBe(1);
  expect(badge(done)).toBeUndefined(); // the selection icon has no badge; only the field's does
  expect(grammarCount(reducer(state, { type: 'checked', check: { text: 'other' } }))).toBeUndefined();
  expect(grammarCount(reducer(state, { type: 'checked', check: { text: 'hello', error: { message: 'x' } } }))).toBe('error');
});

it('badges a wrong layout on both icons, until the text changes', () => {
  const mistyped = { text: 'hello', verdict: 'mistyped' as const };
  const field = reducer(reducer(hidden, { type: 'select', selection, anchor, field: true }), { type: 'checked', check: mistyped });
  const picked = reducer(reducer(hidden, { type: 'select', selection: { ...selection, kind: 'text-control' } as EditableSelection, anchor }), { type: 'checked', check: mistyped });
  expect(badge(field)).toBe('layout');
  expect(badge(picked)).toBe('layout');
  expect(isMistyped(field)).toBe(true);
  expect(answered(mistyped)).toBe(true);

  const edited = reducer(field, { type: 'select', selection: { ...selection, text: 'hello!' } as EditableSelection, anchor, field: true });
  expect(isMistyped(edited)).toBe(false);
  expect(badge(edited)).toBeUndefined();
});

it('gives a selection icon no grammar count, only its spinner while its own text is checked', () => {
  const picked = reducer(hidden, { type: 'select', selection: { ...selection, kind: 'text-control' } as EditableSelection, anchor });
  expect(isChecking(reducer(picked, { type: 'checked', check: { text: 'hello' } }))).toBe(true);
  expect(isChecking(reducer(picked, { type: 'checked', check: { text: 'other' } }))).toBe(false);
  expect(badge(reducer(picked, { type: 'checked', check: { text: 'hello', errors: 1 } }))).toBeUndefined();
  // Page text is never checked, so it never spins.
  const page = reducer(hidden, { type: 'select', selection: { ...selection, kind: 'page' } as EditableSelection, anchor });
  expect(isChecking(reducer(page, { type: 'checked', check: { text: 'hello' } }))).toBe(false);
});

it('badges random keystrokes "?" on both icons -- never a clean check', () => {
  const noise = { text: 'hello', verdict: 'gibberish' as const };
  const field = reducer(reducer(hidden, { type: 'select', selection, anchor, field: true }), { type: 'checked', check: noise });
  const picked = reducer(reducer(hidden, { type: 'select', selection: { ...selection, kind: 'text-control' } as EditableSelection, anchor }), { type: 'checked', check: noise });
  expect(badge(field)).toBe('gibberish');
  expect(badge(picked)).toBe('gibberish');
  expect(grammarCount(field)).toBe('gibberish');
});

it('an applied fix is a clean check: green ✓ on the field icon', () => {
  const state = { ...reducer(hidden, { type: 'select', selection: { text: 'a < b & c' } as EditableSelection, anchor, field: true }), check: cleanCheck('a < b & c') };
  expect(badge(state)).toBe(0);
});

it('counts words for the background check, CJK included', () => {
  expect(hasEnoughWords('hello there')).toBe(false);
  expect(hasEnoughWords('hello there , !')).toBe(false);
  expect(hasEnoughWords('hello there friend')).toBe(true);
  expect(hasEnoughWords('我今天去学校')).toBe(true);
});
