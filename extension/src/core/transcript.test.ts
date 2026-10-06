import { describe, expect, it, vi } from 'vitest';
import type { FixEdit } from '../../../shared/contract';
import { clock, emptyTranscript, fixParts, highlightText, lineView, transcriptActions, transcriptReducer, words, type TranscriptAction, type TranscriptDeps, type TranscriptState } from './transcript';

const run = (state: TranscriptState, ...actions: TranscriptAction[]) => actions.reduce(transcriptReducer, state);
const edit = (start: number, original: string, replacement: string, reason = ''): FixEdit => ({ start, end: start + original.length, original, replacement, kind: 'error', reason });

describe('words / highlightText', () => {
  it('cuts a line into pieces that join back to it, words marked', () => {
    const pieces = words("Let's touch base, ok?");
    expect(pieces.map((p) => p.text).join('')).toBe("Let's touch base, ok?");
    expect(pieces.filter((p) => p.word).map((p) => p.text)).toEqual(["Let's", 'touch', 'base', 'ok']);
  });

  it('returns the highlighted words with what lies between, in either direction', () => {
    const text = "Let's touch base on Friday.";
    const touch = words(text).findIndex((p) => p.text === 'touch');
    const base = words(text).findIndex((p) => p.text === 'base');
    expect(highlightText(text, touch, base)).toBe('touch base');
    expect(highlightText(text, base, touch)).toBe('touch base');
  });
});

describe('fixParts / clock', () => {
  it('interleaves unchanged text with struck originals and replacements', () => {
    expect(fixParts('I has send it', [edit(2, 'has send', 'have sent')])).toEqual([
      { text: 'I ', kind: 'same' },
      { text: 'has send', kind: 'del' },
      { text: 'have sent', kind: 'ins' },
      { text: ' it', kind: 'same' },
    ]);
  });

  it('formats m:ss and h:mm:ss', () => {
    expect(clock(872)).toBe('14:32');
    expect(clock(3725)).toBe('1:02:05');
  });
});

describe('transcriptReducer', () => {
  it('drops an answer for a card closed or replaced while loading', () => {
    const start: TranscriptAction = { type: 'result-start', line: 'l1', kind: 'translate', text: 'base' };
    const done: TranscriptAction = { type: 'result-done', line: 'l1', kind: 'translate', result: { body: 'база' } };
    expect(run(emptyTranscript(), start, done).results['l1']).toMatchObject({ status: 'done', body: 'база' });
    expect(run(emptyTranscript(), start, { type: 'close-result', line: 'l1' }, done).results).toEqual({});
    expect(run(emptyTranscript(), start, { type: 'result-start', line: 'l1', kind: 'explain', text: 'base' }, done).results['l1']).toMatchObject({ kind: 'explain', status: 'loading' });
  });
});

describe('lineView', () => {
  const line = { id: 'l1', t: 65, text: 'I has send it', me: true };
  const who = { name: 'You', color: '#46699D' };

  it("shows the user's error count, and whether its fixes are open", () => {
    expect(lineView(run(emptyTranscript(), { type: 'check-start', line: 'l1' }), line, who).check).toEqual({ kind: 'checking' });
    expect(lineView(run(emptyTranscript(), { type: 'check-done', line: 'l1', errors: 0 }), line, who).check).toEqual({ kind: 'clean' });
    const open = run(emptyTranscript(), { type: 'check-done', line: 'l1', errors: 2 }, { type: 'result-start', line: 'l1', kind: 'fix', text: line.text });
    expect(lineView(open, line, who)).toMatchObject({ t: '1:05', check: { kind: 'errors', count: 2, open: true }, result: { kind: 'loading' } });
  });

  it("lights the highlighted pieces; other speakers' lines have no check", () => {
    const view = lineView(run(emptyTranscript(), { type: 'highlight', highlight: { line: 'l1', from: 2, to: 0 } }), { ...line, me: false }, who);
    expect(view.pieces.filter((p) => p.lit).map((p) => p.text).join('')).toBe('I has');
    expect(view.highlighted).toBe(true);
    expect(view.check).toBeNull();
  });

  it('maps a fix to parts and why, and an empty one to clean', () => {
    const fixed = (edits: FixEdit[]) =>
      lineView(run(emptyTranscript(), { type: 'result-start', line: 'l1', kind: 'fix', text: line.text }, { type: 'result-done', line: 'l1', kind: 'fix', result: { fix: { text: '', edits } } }), line, who).result;
    expect(fixed([edit(2, 'has send', 'have sent', 'Use "have sent".')])).toMatchObject({ kind: 'fix', why: 'Use "have sent".' });
    expect(fixed([])).toMatchObject({ kind: 'clean' });
  });
});

describe('transcriptActions', () => {
  const deps = (over: Partial<TranscriptDeps> = {}) => {
    let state = emptyTranscript();
    const d: TranscriptDeps = {
      translate: vi.fn(async (text: string) => ({ ok: true as const, data: { text: `[uk] ${text}` } })),
      explain: vi.fn(async () => ({ ok: true as const, data: { meaning: 'to talk again', examples: ['e1', 'e2'], lang: 'en' } })),
      check: vi.fn(async () => ({ ok: true as const, data: { errors: 2 } })),
      fix: vi.fn(async (text: string) => ({ ok: true as const, data: { text, html: '', edits: [] } })),
      addWord: vi.fn(async () => {}),
      removeWord: vi.fn(async () => {}),
      targetLang: async () => 'uk',
      dispatch: (action) => (state = transcriptReducer(state, action)),
      ...over,
    };
    return { d, state: () => state };
  };
  const line = { id: 'l1', text: "Let's touch base on Friday." };
  const touchBase = { line: 'l1', from: words(line.text).findIndex((p) => p.text === 'touch'), to: words(line.text).findIndex((p) => p.text === 'base') };

  it('translates the highlight into the user language and clears the highlight', async () => {
    const { d, state } = deps();
    await transcriptActions(d).run('translate', line, touchBase);
    expect(d.translate).toHaveBeenCalledWith('touch base', 'uk');
    expect(state().results['l1']).toMatchObject({ kind: 'translate', status: 'done', body: '[uk] touch base', lang: 'uk' });
    expect(state().highlight).toBeNull();
  });

  it('adds a word to the vocabulary with its meaning, line and examples', async () => {
    const { d, state } = deps();
    await transcriptActions(d).run('vocab', line, touchBase);
    expect(d.explain).toHaveBeenCalledWith('touch base', line.text, 'uk');
    expect(d.addWord).toHaveBeenCalledWith({ word: 'touch base', lang: 'en', meaning: 'to talk again', context: line.text, examples: ['e1', 'e2'] });
    expect(state().results['l1']).toMatchObject({ kind: 'vocab', status: 'done', lang: 'en' });

    await transcriptActions(d).undoVocab('l1', state().results['l1']!);
    expect(d.removeWord).toHaveBeenCalledWith('touch base', 'en');
    expect(state().results['l1']).toBeUndefined();
  });

  it('shows a failure and saves nothing when explaining fails', async () => {
    const { d, state } = deps({ explain: vi.fn(async () => ({ ok: false as const })) });
    await transcriptActions(d).run('vocab', line, touchBase);
    expect(d.addWord).not.toHaveBeenCalled();
    expect(state().results['l1']).toMatchObject({ status: 'error' });
  });

  it('checks a line, then shows its fixes: a cached fix asks nothing, open ones close', async () => {
    const onChecked = vi.fn();
    const { d, state } = deps({ onChecked, cachedFix: () => ({ text: 'x', edits: [] }) });
    const actions = transcriptActions(d);
    await actions.check(line);
    expect(state().checks['l1']).toEqual({ status: 'done', errors: 2 });
    expect(onChecked).toHaveBeenCalledWith('l1', 2);
    await actions.showFixes(line, false);
    expect(d.fix).not.toHaveBeenCalled();
    expect(state().results['l1']).toMatchObject({ kind: 'fix', status: 'done' });
    await actions.showFixes(line, true);
    expect(state().results['l1']).toBeUndefined();
  });
});
