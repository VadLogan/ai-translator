import type { ExplainOk, FixEdit, FixGrammarOk, TranslateOk } from '../../../shared/contract';

/*
 * A meeting transcript's interactive layer, shared by the live meeting card and the popup's
 * meeting detail. Other speakers' lines: highlight words → Translate / Explain / Add to vocabulary.
 * The user's lines: an error count (/check) → "Show fixes" (/fix-grammar) under the original.
 */

export type ResultKind = 'translate' | 'explain' | 'vocab' | 'fix';

export type Fix = { text: string; edits: FixEdit[] };

export interface TranscriptResult {
  kind: ResultKind;
  status: 'loading' | 'done' | 'error';
  /** What was asked about: the highlight, or the whole line for a fix. */
  text: string;
  /** translate: the translation. explain / vocab: the meaning. */
  body?: string;
  lang?: string;
  examples?: string[];
  fix?: Fix;
}

/** Piece indexes into `words(text)`, inclusive, in order. */
export interface Highlight {
  line: string;
  from: number;
  to: number;
}

export type Check = { status: 'checking' } | { status: 'done'; errors: number } | { status: 'error' };

export interface TranscriptState {
  highlight: Highlight | null;
  /** One open result card per line; a new action on the line replaces it. */
  results: Record<string, TranscriptResult>;
  /** The user's lines only. */
  checks: Record<string, Check>;
}

export type TranscriptAction =
  | { type: 'highlight'; highlight: Highlight | null }
  | { type: 'result-start'; line: string; kind: ResultKind; text: string }
  | { type: 'result-done'; line: string; kind: ResultKind; result: Omit<TranscriptResult, 'kind' | 'status' | 'text'> }
  | { type: 'result-error'; line: string; kind: ResultKind }
  | { type: 'close-result'; line: string }
  | { type: 'check-start'; line: string }
  | { type: 'check-done'; line: string; errors: number }
  | { type: 'check-error'; line: string };

export const emptyTranscript = (checks: Record<string, Check> = {}): TranscriptState => ({ highlight: null, results: {}, checks });

export function transcriptReducer(state: TranscriptState, action: TranscriptAction): TranscriptState {
  switch (action.type) {
    case 'highlight':
      return { ...state, highlight: action.highlight };
    case 'result-start':
      return { ...state, results: { ...state.results, [action.line]: { kind: action.kind, status: 'loading', text: action.text } } };
    case 'result-done':
    case 'result-error': {
      const open = state.results[action.line];
      // Closed, or replaced by another action on the line, while loading: the answer has nowhere to go.
      if (open?.kind !== action.kind || open.status !== 'loading') return state;
      const next = action.type === 'result-done' ? { ...open, ...action.result, status: 'done' as const } : { ...open, status: 'error' as const };
      return { ...state, results: { ...state.results, [action.line]: next } };
    }
    case 'close-result': {
      const { [action.line]: _closed, ...results } = state.results;
      return { ...state, results };
    }
    case 'check-start':
      return { ...state, checks: { ...state.checks, [action.line]: { status: 'checking' } } };
    case 'check-done':
      return { ...state, checks: { ...state.checks, [action.line]: { status: 'done', errors: action.errors } } };
    case 'check-error':
      return { ...state, checks: { ...state.checks, [action.line]: { status: 'error' } } };
  }
}

export interface Piece {
  text: string;
  /** A word (or number) one can highlight; spaces and punctuation are not. */
  word: boolean;
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

/** The line cut into words and what lies between them; joined back, the pieces are the line. */
export const words = (text: string): Piece[] => [...segmenter.segment(text)].map((s) => ({ text: s.segment, word: !!s.isWordLike }));

/** The highlighted words with whatever lies between them, as said. */
export const highlightText = (text: string, from: number, to: number): string =>
  words(text)
    .slice(Math.min(from, to), Math.max(from, to) + 1)
    .map((p) => p.text)
    .join('')
    .trim();

export interface FixPart {
  text: string;
  kind: 'same' | 'del' | 'ins';
}

/** The text with each edit as a struck original then its replacement. Edits are in order and don't overlap. */
export function fixParts(text: string, edits: FixEdit[]): FixPart[] {
  const parts: FixPart[] = [];
  let at = 0;
  for (const edit of edits) {
    if (edit.start > at) parts.push({ text: text.slice(at, edit.start), kind: 'same' });
    if (edit.original) parts.push({ text: edit.original, kind: 'del' });
    if (edit.replacement) parts.push({ text: edit.replacement, kind: 'ins' });
    at = edit.end;
  }
  if (at < text.length) parts.push({ text: text.slice(at), kind: 'same' });
  return parts;
}

/* ---------- What the shared TranscriptLine renders ---------- */

export type CheckView = { kind: 'checking' } | { kind: 'clean' } | { kind: 'errors'; count: number; open: boolean } | { kind: 'failed' };

export type ResultView =
  | { kind: 'loading'; title: string }
  | { kind: 'error'; title: string }
  | { kind: 'body'; title: string; body: string; lang?: string; list: string[] }
  | { kind: 'vocab'; title: string; word: string; meaning: string }
  | { kind: 'fix'; title: string; parts: FixPart[]; why: string }
  | { kind: 'clean'; title: string };

export interface TranscriptLineView {
  id: string;
  name: string;
  color: string;
  /** "m:ss" (or "h:mm:ss"). */
  t: string;
  me: boolean;
  pieces: (Piece & { lit: boolean })[];
  highlighted: boolean;
  check: CheckView | null;
  result: ResultView | null;
}

const TITLE: Record<ResultKind, string> = { translate: 'Translation', explain: 'Explanation', vocab: 'Added to your vocabulary', fix: 'Fixes' };
const ERROR: Record<ResultKind, string> = { translate: 'Translation', explain: 'Explanation', vocab: 'Adding to vocabulary', fix: 'Fixing' };

/** `m:ss`, or `h:mm:ss` past the hour. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

function resultView(r: TranscriptResult | undefined): ResultView | null {
  if (!r) return null;
  if (r.status === 'loading') return { kind: 'loading', title: TITLE[r.kind] };
  if (r.status === 'error') return { kind: 'error', title: `${ERROR[r.kind]} failed` };
  if (r.kind === 'fix') {
    const edits = r.fix?.edits ?? [];
    if (!edits.length) return { kind: 'clean', title: TITLE.fix };
    return { kind: 'fix', title: TITLE.fix, parts: fixParts(r.text, edits), why: edits.map((e) => e.reason).filter(Boolean).join(' ') };
  }
  if (r.kind === 'vocab') return { kind: 'vocab', title: TITLE.vocab, word: r.text, meaning: r.body ?? '' };
  return { kind: 'body', title: TITLE[r.kind], body: r.body ?? '', lang: r.lang, list: r.examples ?? [] };
}

function checkView(check: Check | undefined, result: TranscriptResult | undefined): CheckView | null {
  if (!check) return null;
  if (check.status === 'checking') return { kind: 'checking' };
  if (check.status === 'error') return { kind: 'failed' };
  return check.errors ? { kind: 'errors', count: check.errors, open: result?.kind === 'fix' } : { kind: 'clean' };
}

export function lineView(state: TranscriptState, line: { id: string; t: number; text: string; me: boolean }, speaker: { name: string; color: string }): TranscriptLineView {
  const h = state.highlight?.line === line.id ? state.highlight : null;
  const [from, to] = h ? [Math.min(h.from, h.to), Math.max(h.from, h.to)] : [-1, -2];
  return {
    id: line.id,
    name: speaker.name,
    color: speaker.color,
    t: clock(line.t),
    me: line.me,
    pieces: words(line.text).map((p, i) => ({ ...p, lit: i >= from && i <= to })),
    highlighted: !!h,
    check: line.me ? checkView(state.checks[line.id], state.results[line.id]) : null,
    result: resultView(state.results[line.id]),
  };
}

/* ---------- The actions, with the surface's senders passed in ---------- */

type Answer<T> = { ok: true; data: T } | { ok: false };

export interface TranscriptDeps {
  translate(text: string, targetLang: string): Promise<Answer<TranslateOk>>;
  explain(text: string, context: string, targetLang: string): Promise<Answer<ExplainOk>>;
  check(text: string): Promise<Answer<{ errors: number }>>;
  fix(text: string): Promise<Answer<FixGrammarOk>>;
  addWord(word: { word: string; lang: string; meaning: string; context: string; examples: string[] }): Promise<void>;
  removeWord(word: string, lang: string): Promise<void>;
  /** The user's language: translations and explanations are written in it. */
  targetLang(): Promise<string>;
  dispatch(action: TranscriptAction): void;
  /** A fix fetched earlier (the saved meeting's), shown without asking again. */
  cachedFix?(line: string): Fix | undefined;
  /** Each answered check and fix, for the surface to keep (the saved meeting). */
  onChecked?(line: string, errors: number): void;
  onFixed?(line: string, fix: Fix): void;
}

/** The one place the transcript's buttons turn into requests. Both surfaces build it with their own senders. */
export function transcriptActions(deps: TranscriptDeps) {
  const { dispatch } = deps;
  return {
    /** Translate / Explain / Add to vocabulary on the highlighted words of a line. */
    async run(kind: Exclude<ResultKind, 'fix'>, line: { id: string; text: string }, highlight: Highlight) {
      const text = highlightText(line.text, highlight.from, highlight.to);
      if (!text) return;
      dispatch({ type: 'highlight', highlight: null });
      dispatch({ type: 'result-start', line: line.id, kind, text });
      const lang = await deps.targetLang();
      if (kind === 'translate') {
        const answer = await deps.translate(text, lang);
        return dispatch(answer.ok ? { type: 'result-done', line: line.id, kind, result: { body: answer.data.text, lang } } : { type: 'result-error', line: line.id, kind });
      }
      const answer = await deps.explain(text, line.text, lang);
      if (!answer.ok) return dispatch({ type: 'result-error', line: line.id, kind });
      const { meaning, examples } = answer.data;
      if (kind === 'vocab') await deps.addWord({ word: text, lang: answer.data.lang, meaning, context: line.text, examples });
      // A vocab card keeps the word's own language, for its Undo; an explanation, the language it is written in.
      dispatch({ type: 'result-done', line: line.id, kind, result: { body: meaning, lang: kind === 'vocab' ? answer.data.lang : lang, examples } });
    },
    /** The vocabulary card's Undo: the word leaves the vocabulary again. */
    async undoVocab(line: string, result: TranscriptResult) {
      if (result.kind !== 'vocab' || result.status !== 'done') return;
      await deps.removeWord(result.text, result.lang ?? '');
      dispatch({ type: 'close-result', line });
    },
    /** The user's line: count its errors. */
    async check(line: { id: string; text: string }) {
      dispatch({ type: 'check-start', line: line.id });
      const answer = await deps.check(line.text);
      if (!answer.ok) return dispatch({ type: 'check-error', line: line.id });
      dispatch({ type: 'check-done', line: line.id, errors: answer.data.errors });
      deps.onChecked?.(line.id, answer.data.errors);
    },
    /** "Show fixes" on the user's line: the fix under the original; pressed again, it closes. */
    async showFixes(line: { id: string; text: string }, open: boolean) {
      if (open) return dispatch({ type: 'close-result', line: line.id });
      dispatch({ type: 'result-start', line: line.id, kind: 'fix', text: line.text });
      const cached = deps.cachedFix?.(line.id);
      if (cached) return dispatch({ type: 'result-done', line: line.id, kind: 'fix', result: { fix: cached } });
      const answer = await deps.fix(line.text);
      if (!answer.ok) return dispatch({ type: 'result-error', line: line.id, kind: 'fix' });
      const fix = { text: answer.data.text, edits: answer.data.edits };
      dispatch({ type: 'result-done', line: line.id, kind: 'fix', result: { fix } });
      deps.onFixed?.(line.id, fix);
    },
  };
}
