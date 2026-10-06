import { expect, it, vi } from 'vitest';
import type { EditableSelection } from '../../content/selection';
import { findLanguage } from '../../core/languages';
import { hidden, reducer, type State } from './state';
import { toCheck, toDetection, toView } from './view';

const actions = { onPick: vi.fn(), onBack: vi.fn(), onClose: vi.fn(), onReplaceEdit: vi.fn(), onIgnoreEdit: vi.fn(), onReplaceAll: vi.fn(), onStep: vi.fn(), onRecheck: vi.fn(), onStopDictation: vi.fn(), onInsertDictation: vi.fn(), onSaveException: vi.fn() };
const anchor = { x: 1, top: 2, bottom: 3 };
const selected = (text: string, kind = 'input'): State =>
  reducer(hidden, { type: 'select', selection: { text, kind } as unknown as EditableSelection, anchor });

it('names the detected language and leaves it out of the targets', () => {
  let state = reducer(selected('hello'), { type: 'open', languages: ['en', 'de'].map((code) => findLanguage(code)!), pairs: [] });
  state = reducer(state, { type: 'detected', detection: { lang: 'en' } });
  const view = toView(state, actions);
  expect(view).toMatchObject({ kind: 'languages', detectedName: 'English', detectedLang: 'en', readOnly: false });
  expect(view.kind === 'languages' && view.languages.map(({ code }) => code)).toEqual(['de']);
});

it('suggests the usual pair target above the list', () => {
  let state = reducer(selected('cześć wszystkim'), { type: 'open', languages: ['uk', 'en'].map((code) => findLanguage(code)!), pairs: [{ from: 'pl', to: 'uk' }] });
  state = reducer(state, { type: 'detected', detection: { lang: 'pl' } });
  const view = toView(state, actions);
  expect(view.kind === 'languages' && view.suggested?.code).toBe('uk');
  expect(view.kind === 'languages' && view.languages.map(({ code }) => code)).toEqual(['en']);
});

it("shows page text's translation field: skeleton lines sized to the selection, then the text", () => {
  let state = reducer(selected('x'.repeat(100), 'page'), { type: 'open', languages: [], pairs: [{ from: 'pl', to: 'uk' }] });
  state = reducer(reducer(state, { type: 'detected', detection: { lang: 'pl' } }), { type: 'translation', translation: { lang: 'uk' } });
  expect(toView(state, actions)).toMatchObject({ suggested: undefined, translation: { lang: 'uk', lines: 3 } });
  state = reducer(state, { type: 'translation', translation: { lang: 'uk', text: 'привіт' } });
  expect(toView(state, actions)).toMatchObject({ translation: { text: 'привіт' } });
});

it('offers the re-typed text only when detection says mistyped', () => {
  let state = reducer(selected('ghbdtn'), { type: 'open', languages: [], pairs: [] });
  expect(toView(state, actions)).toMatchObject({ layoutPreview: undefined });
  state = reducer(state, { type: 'detected', detection: 'mistyped' });
  expect(toView(state, actions)).toMatchObject({ detectedName: 'wrong keyboard layout', layoutPreview: 'привет' });
});

it('marks page text read-only and gives its icon no hover pill', () => {
  const state = selected('hello', 'page');
  expect(toView(state, actions)).toMatchObject({ kind: 'icon', canDisable: false });
  expect(toView(reducer(state, { type: 'open', languages: [], pairs: [] }), actions)).toMatchObject({ readOnly: true });
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

it('maps the grammar panel onto the shown edit, skipping ignored ones', () => {
  const until = { start: 0, end: 5, original: 'until', replacement: 'by', kind: 'native' as const, reason: 'A deadline takes "by".' };
  const teh = { start: 13, end: 16, original: 'teh', replacement: 'the', kind: 'error' as const, reason: 'Spelling.' };
  const fix = { text: 'by Friday see the file', html: '', edits: [until, teh] };
  const field = { kind: 'text-control', text: 'until Friday see teh file', element: {} } as unknown as EditableSelection;
  let state = reducer(reducer(hidden, { type: 'select', selection: field, anchor }), { type: 'checked', check: { text: 'until Friday see teh file', errors: 2, fix } });
  state = reducer(state, { type: 'show', screen: { kind: 'grammar', fix, index: 1, base: 0, field: true } });
  let view = toView(state, actions);
  expect(view).toMatchObject({ kind: 'grammar', index: 1, ignored: [], edits: [{ original: 'until' }, { original: 'teh', replacement: 'the', kind: 'error' }] });
  if (view.kind === 'grammar') view.onReplace();
  expect(actions.onReplaceEdit).toHaveBeenCalledWith(teh);

  state = reducer(state, { type: 'ignore', edit: until });
  view = toView(state, actions);
  expect(view).toMatchObject({ kind: 'grammar', index: 0, ignored: [0], edits: [{ original: 'teh' }] });
});

it('maps voice input: listening, then transcribing; ✕ closes', () => {
  const state = reducer(selected('hi'), { type: 'show', screen: { kind: 'recording' } });
  const view = toView(state, actions);
  expect(view).toMatchObject({ kind: 'recording', transcribing: false, level: 0, seconds: 0, onStop: actions.onStopDictation, onCancel: actions.onClose });
  expect(toView(reducer(state, { type: 'show', screen: { kind: 'recording', level: 0.5, ms: 7400, text: 'I have' } }), actions)).toMatchObject({ level: 0.5, seconds: 7.4, text: 'I have' });
  expect(toView(reducer(state, { type: 'show', screen: { kind: 'recording', transcribing: true } }), actions)).toMatchObject({ transcribing: true });
});

it("gives a dictation's grammar panel its transcript and Insert of the fixed text", () => {
  let state = reducer(selected('I has a dog', 'page'), { type: 'dictated', dictation: { transcript: 'I has a dog', text: 'I have a dog', at: 0 } });
  state = reducer(state, { type: 'show', screen: { kind: 'grammar', fix: { text: 'I have a dog', html: 'I have a dog', edits: [] }, index: 0, base: 0, field: false, dictated: true } });
  const view = toView(state, actions);
  expect(view).toMatchObject({ kind: 'grammar', dictation: { transcript: 'I has a dog', text: 'I have a dog' } });
  if (view.kind === 'grammar') view.dictation?.onInsert();
  expect(actions.onInsertDictation).toHaveBeenCalledWith('I have a dog');
});

it("offers Insert on a dictation's translation only once it has answered", () => {
  let state = reducer(selected('Hallo', 'page'), { type: 'dictated', dictation: { transcript: 'Hallo', text: 'Hallo', at: 0 } });
  state = reducer(reducer(state, { type: 'open', languages: [], pairs: [] }), { type: 'translation', translation: { lang: 'en' } });
  expect(toView(state, actions)).toMatchObject({ kind: 'languages', dictation: { transcript: 'Hallo', text: undefined } });
  state = reducer(state, { type: 'translation', translation: { lang: 'en', text: 'Hello' } });
  expect(toView(state, actions)).toMatchObject({ dictation: { text: 'Hello' } });
});

it('offers "Add to Exceptions" for a word or a short name, not a sentence', () => {
  const menu = (text: string) => toView(reducer(selected(text), { type: 'open', languages: [], pairs: [] }), actions);
  expect(menu('TypeMeant')).toMatchObject({ canAddException: true });
  expect(menu('type meant')).toMatchObject({ canAddException: true });
  expect(menu('This is a whole sentence about it.')).toMatchObject({ canAddException: false });
});

it('opens the exception form on the trimmed selection; page text has nothing to fix', () => {
  const form = (kind: string) => toView(reducer(selected(' Apfel ', kind), { type: 'show', screen: { kind: 'exception' } }), actions);
  expect(form('input')).toMatchObject({ kind: 'exception', selected: 'Apfel', canFix: true });
  expect(form('page')).toMatchObject({ canFix: false });
});
