import { expect, it } from 'vitest';
import { badge, cleanCheck, countFixes, grammarCount, hasEnoughWords, isChecking, isMistyped, detectedLang, hidden, isMenuOpen, menuLanguages, reducer } from './translator-state';
import type { EditableSelection } from '../selection';
import { findLanguage } from '../../core/languages';

const selection = { text: 'hello' } as EditableSelection;
const anchor = { x: 1, top: 2, bottom: 3 };

it('walks icon → menu → detected → close', () => {
  let state = reducer(hidden, { type: 'select', selection, anchor });
  expect(state.screen).toEqual({ kind: 'icon', field: undefined });
  expect(isMenuOpen(state)).toBe(false);

  state = reducer(state, { type: 'open', languages: [findLanguage('de')!] });
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

it('counts one error per span.fix', () => {
  expect(countFixes('I <span class="fix" data-original="has">have</span> gone<span class="fix" data-original="">.</span>')).toBe(2);
  expect(countFixes('All good &lt;span class="fix"&gt;')).toBe(0);
});

it('badges the field icon only while the check matches the text', () => {
  const fix = { text: 'I have gone.', html: 'I <span class="fix" data-original="has">have</span> gone.', mistyped: false, gibberish: false };
  let state = reducer(hidden, { type: 'select', selection, anchor, field: true });
  state = reducer(state, { type: 'checked', check: { text: 'hello', fix } });
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
  state = reducer(state, { type: 'checked', check: { text: 'hello', fix: null, error: { message: 'Rate limited' } } });
  expect(badge(state)).toBe('error');
  expect(isChecking(state)).toBe(false);
});

it('spins while the check is in flight, then badges', () => {
  let state = reducer(hidden, { type: 'select', selection, anchor, field: true });
  state = reducer(state, { type: 'checked', check: { text: 'hello', fix: null } });
  expect(isChecking(state)).toBe(true);
  expect(badge(state)).toBeUndefined();

  state = reducer(state, { type: 'checked', check: { text: 'hello', fix: { text: 'Hello', html: '<span class="fix" data-original="hello">Hello</span>', mistyped: false, gibberish: false } } });
  expect(isChecking(state)).toBe(false);
  expect(badge(state)).toBe(1);
});

it('leaves the detected language out of the targets', () => {
  const de = findLanguage('de')!;
  const en = findLanguage('en')!;
  let state = reducer(reducer(hidden, { type: 'select', selection, anchor }), { type: 'open', languages: [en, de] });
  expect(menuLanguages(state)).toEqual([en, de]);
  state = reducer(state, { type: 'detected', detection: { lang: 'en' } });
  expect(menuLanguages(state)).toEqual([de]);
});

it('counts the grammar fixes of the selected text only', () => {
  const state = reducer(hidden, { type: 'select', selection, anchor });
  expect(grammarCount(state)).toBeUndefined();
  expect(grammarCount(reducer(state, { type: 'checked', check: { text: 'hello', fix: null } }))).toBe('checking');
  const done = reducer(state, { type: 'checked', check: { text: 'hello', fix: { text: 'Hello', html: '<span class="fix" data-original="hello">Hello</span>', mistyped: false, gibberish: false } } });
  expect(grammarCount(done)).toBe(1);
  expect(badge(done)).toBeUndefined(); // the selection icon has no badge; only the field's does
  expect(grammarCount(reducer(state, { type: 'checked', check: { text: 'other', fix: null } }))).toBeUndefined();
  expect(grammarCount(reducer(state, { type: 'checked', check: { text: 'hello', fix: null, error: { message: 'x' } } }))).toBe('error');
});

it('badges a wrong layout on both icons, until the user dismisses it', () => {
  const mistyped = { text: 'hello', fix: { text: 'hello', html: 'hello', mistyped: true, gibberish: false } };
  const field = reducer(reducer(hidden, { type: 'select', selection, anchor, field: true }), { type: 'checked', check: mistyped });
  const picked = reducer(reducer(hidden, { type: 'select', selection: { ...selection, kind: 'text-control' } as EditableSelection, anchor }), { type: 'checked', check: mistyped });
  expect(badge(field)).toBe('layout');
  expect(badge(picked)).toBe('layout');
  expect(isMistyped(field)).toBe(true);

  const dismissed = reducer(field, { type: 'dismissWarning' });
  expect(isMistyped(dismissed)).toBe(false);
  expect(badge(dismissed)).toBeUndefined(); // gibberish has no error count either
});

it('gives a selection icon no grammar count, only its spinner while its own text is checked', () => {
  const picked = reducer(hidden, { type: 'select', selection: { ...selection, kind: 'text-control' } as EditableSelection, anchor });
  const fix = { text: 'Hello', html: '<span class="fix" data-original="hello">Hello</span>', mistyped: false, gibberish: false };
  expect(isChecking(reducer(picked, { type: 'checked', check: { text: 'hello', fix: null } }))).toBe(true);
  expect(isChecking(reducer(picked, { type: 'checked', check: { text: 'other', fix: null } }))).toBe(false);
  expect(badge(reducer(picked, { type: 'checked', check: { text: 'hello', fix } }))).toBeUndefined();
  // Page text is never checked, so it never spins.
  const page = reducer(hidden, { type: 'select', selection: { ...selection, kind: 'page' } as EditableSelection, anchor });
  expect(isChecking(reducer(page, { type: 'checked', check: { text: 'hello', fix: null } }))).toBe(false);
});

it('badges random keystrokes "?" on both icons -- never a clean check -- until waved off', () => {
  const noise = { text: 'hello', fix: { text: 'hello', html: 'hello', mistyped: false, gibberish: true } };
  const field = reducer(reducer(hidden, { type: 'select', selection, anchor, field: true }), { type: 'checked', check: noise });
  const picked = reducer(reducer(hidden, { type: 'select', selection: { ...selection, kind: 'text-control' } as EditableSelection, anchor }), { type: 'checked', check: noise });
  expect(badge(field)).toBe('gibberish');
  expect(badge(picked)).toBe('gibberish');
  expect(badge(reducer(field, { type: 'dismissWarning' }))).toBeUndefined();
});

it('an applied fix is a clean check: green ✓ on the field icon, html escaped', () => {
  const state = { ...reducer(hidden, { type: 'select', selection: { text: 'a < b & c' } as EditableSelection, anchor, field: true }), check: cleanCheck('a < b & c') };
  expect(badge(state)).toBe(0);
  expect(state.check.fix?.html).toBe('a &lt; b &amp; c');
});

it('counts words for the background check, CJK included', () => {
  expect(hasEnoughWords('hello there')).toBe(false);
  expect(hasEnoughWords('hello there , !')).toBe(false);
  expect(hasEnoughWords('hello there friend')).toBe(true);
  expect(hasEnoughWords('我今天去学校')).toBe(true);
});
