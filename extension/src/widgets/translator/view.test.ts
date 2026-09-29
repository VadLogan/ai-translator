import { expect, it, vi } from 'vitest';
import type { EditableSelection } from '../../content/selection';
import { findLanguage } from '../../core/languages';
import { hidden, reducer, type State } from './state';
import { toCheck, toDetection, toView } from './view';

const actions = { onPick: vi.fn(), onBack: vi.fn(), onReplace: vi.fn(), onCopyFix: vi.fn(), onRewrite: vi.fn(), onClose: vi.fn() };
const anchor = { x: 1, top: 2, bottom: 3 };
const selected = (text: string, kind = 'input'): State =>
  reducer(hidden, { type: 'select', selection: { text, kind } as unknown as EditableSelection, anchor });

it('names the detected language and leaves it out of the targets', () => {
  let state = reducer(selected('hello'), { type: 'open', languages: ['en', 'de'].map((code) => findLanguage(code)!) });
  state = reducer(state, { type: 'detected', detection: { lang: 'en' } });
  const view = toView(state, actions);
  expect(view).toMatchObject({ kind: 'languages', detectedName: 'English', detectedLang: 'en', readOnly: false });
  expect(view.kind === 'languages' && view.languages.map(({ code }) => code)).toEqual(['de']);
});

it('offers the re-typed text only when detection says mistyped', () => {
  let state = reducer(selected('ghbdtn'), { type: 'open', languages: [] });
  expect(toView(state, actions)).toMatchObject({ layoutPreview: undefined });
  state = reducer(state, { type: 'detected', detection: 'mistyped' });
  expect(toView(state, actions)).toMatchObject({ detectedName: 'wrong keyboard layout', layoutPreview: 'привет' });
});

it('marks page text read-only and gives its icon no hover pill', () => {
  const state = selected('hello', 'page');
  expect(toView(state, actions)).toMatchObject({ kind: 'icon', canDisable: false });
  expect(toView(reducer(state, { type: 'open', languages: [] }), actions)).toMatchObject({ readOnly: true });
});

it('resumes the interrupted translation after sign-in', () => {
  const view = toView(reducer(selected('hello'), { type: 'show', screen: { kind: 'signIn', targetLang: 'de' } }), actions);
  if (view.kind === 'signIn') view.onPick('google');
  expect(actions.onPick).toHaveBeenCalledWith('google', 'de');
});

it('treats "und" and failures as no detection, and a 422 mistyped as one', () => {
  expect(toDetection({ ok: true, data: { lang: 'de' } })).toEqual({ lang: 'de' });
  expect(toDetection({ ok: true, data: { lang: 'und' } })).toBe('unknown');
  expect(toDetection({ ok: false, error: { message: 'x', code: 'mistyped' } })).toBe('mistyped');
  expect(toDetection({ ok: false, error: { message: 'x' } })).toBe('unknown');
});

it('turns a check answer into a count, a verdict or an error', () => {
  expect(toCheck('t', { ok: true, data: { errors: 2 } })).toEqual({ text: 't', errors: 2 });
  expect(toCheck('t', { ok: false, error: { message: 'x', code: 'gibberish' } })).toEqual({ text: 't', verdict: 'gibberish' });
  expect(toCheck('t', { ok: false, error: { message: 'down' } })).toEqual({ text: 't', error: { message: 'down' } });
});
