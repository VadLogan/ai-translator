import { expect, it } from 'vitest';
import { badge, countFixes, grammarCount, isChecking, detectedLang, hidden, isMenuOpen, menuLanguages, reducer } from './translator-state';
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
  const fix = { text: 'I have gone.', html: 'I <span class="fix" data-original="has">have</span> gone.' };
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

  state = reducer(state, { type: 'checked', check: { text: 'hello', fix: { text: 'Hello', html: '<span class="fix" data-original="hello">Hello</span>' } } });
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
  const done = reducer(state, { type: 'checked', check: { text: 'hello', fix: { text: 'Hello', html: '<span class="fix" data-original="hello">Hello</span>' } } });
  expect(grammarCount(done)).toBe(1);
  expect(badge(done)).toBeUndefined(); // the selection icon has no badge; only the field's does
  expect(grammarCount(reducer(state, { type: 'checked', check: { text: 'other', fix: null } }))).toBeUndefined();
  expect(grammarCount(reducer(state, { type: 'checked', check: { text: 'hello', fix: null, error: { message: 'x' } } }))).toBe('error');
});
