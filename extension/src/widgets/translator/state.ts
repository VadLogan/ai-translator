import type { FixEdit, FixGrammarOk } from '../../../../shared/contract';
import type { Language } from '../../core/languages';
import type { Anchor, EditableSelection } from '../../content/selection';
import { pairFor, type Pair } from '../../settings/history';
import { applyEdits, withoutFixEdit } from '../../core/fixEdits';

export { applyEdits, withoutFixEdit };

/** POST /detect's answer: a language, text typed on the wrong keyboard layout, or no idea. */
export type Detection = { lang: string } | 'mistyped' | 'unknown';

export type Screen =
  /** `field`: the focused field's corner icon, which opens the grammar fix instead of the menu. */
  | { kind: 'icon'; field?: boolean }
  | { kind: 'languages' }
  | { kind: 'busy'; label: string }
  /**
   * The grammar panel, one edit at a time. `fix` is null while POST /fix-grammar is still running (a
   * skeleton). `index` is the shown edit among the visible ones. `hover`: opened from an underline, so
   * it closes when the pointer leaves. `field`: the fix is the whole field's (the corner icon, an
   * underline), not a selection's (the menu's "Grammar fix"). `base`: where the fixed text starts in
   * its field -- 0 for the whole field, the selection's offset otherwise. `loading`: `fix` is what is
   * known so far (fixed paragraphs, carried-over edits) while the rest of the field's fixes are in
   * flight; publish swaps in the latest as they answer.
   */
  /** `dictated`: the fix is of `State.dictation.text`, held in the widget, not of text in the field. */
  | { kind: 'grammar'; fix: FixGrammarOk | null; index: number; base: number; field: boolean; hover?: boolean; loading?: boolean; dictated?: boolean }
  /** Voice input into the field: listening (`level` 0..1, `ms` and the live `text` from the recorder), then `transcribing` once stopped. */
  | { kind: 'recording'; transcribing?: boolean; level?: number; ms?: number; text?: string }
  /** The guard found a wrong keyboard layout: the local re-type is all that is offered. */
  | { kind: 'layout' }
  /** The guard found random keystrokes: a notice. Nothing else is offered until the text changes. */
  | { kind: 'notText' }
  /** `targetLang`: the translation to resume after signing in; absent = re-run the grammar check. */
  | { kind: 'signIn'; targetLang?: string }
  /** `back` is where the Back item leads: the menu, or nowhere when retrying can't help. */
  | { kind: 'error'; message: string; back: 'menu' | 'close' };

export interface State {
  /** Captured when the icon appeared; everything acts on this. Null means hidden. */
  selection: EditableSelection | null;
  anchor: Anchor;
  screen: Screen;
  /** The favorites shown in the menu, so digit-key shortcuts can pick among them. */
  languages: readonly Language[];
  /** The user's language pairs from history, most used first: the menu suggests the one matching the detection. */
  pairs: readonly Pair[];
  /**
   * Page text only: the menu's translation field, under the detected line. Asked by itself for the
   * pair's target once detection answers, or by a pick. `text` and `error` both absent = in flight.
   */
  translation: { lang: string; text?: string; error?: string } | null;
  /** Null until detection answers; it is only asked once the menu opens. */
  detection: Detection | null;
  /** The latest grammar check and the text it ran on; `errors`, `verdict` and `error` all absent = in flight. */
  check: Check | null;
  /**
   * Voice input: what was said (`transcript`), the text the panel works on (`text`: the transcript
   * with the grammar edits applied so far), and the field's caret offset Insert writes at. The
   * selection is then a page-kind stand-in for it, so the field is untouched until Insert.
   */
  dictation: { transcript: string; text: string; at: number } | null;
  /** Edits the user waved off in this field (`editKey`), so a re-check doesn't bring them back. Kept until another field is selected. */
  ignored: { element: HTMLElement; keys: string[] } | null;
}

export interface Check {
  text: string;
  /** POST /check's error count, or the fix's own count once a click fetched it. */
  errors?: number;
  /** The API's guard (a 422): no language, so nothing else is asked for this text. */
  verdict?: Verdict;
  error?: { message: string; code?: string };
  /** POST /fix-grammar's answer, asked on click only; kept so a second click reuses it. */
  fix?: FixGrammarOk;
}

export type Verdict = 'mistyped' | 'gibberish';

export const isVerdict = (code: string | undefined): code is Verdict => code === 'mistyped' || code === 'gibberish';

/** The check has answered, one way or another. */
export const answered = (check: Check): boolean => check.errors !== undefined || check.verdict !== undefined || check.error !== undefined;

export type Action =
  | { type: 'select'; selection: EditableSelection; anchor: Anchor; field?: boolean }
  | { type: 'close' }
  | { type: 'open'; languages: readonly Language[]; pairs: readonly Pair[] }
  | { type: 'detected'; detection: Detection }
  | { type: 'translation'; translation: State['translation'] }
  | { type: 'show'; screen: Screen }
  | { type: 'checked'; check: State['check'] }
  /** The field moved under the widget (a scroll): same screen, new anchor. */
  | { type: 'moved'; anchor: Anchor }
  | { type: 'ignore'; edit: FixEdit }
  | { type: 'dictated'; dictation: State['dictation'] }
  /** One edit was written into the field: the selection re-read, the panel and the check rebased onto the new text. */
  | { type: 'edited'; selection: EditableSelection; screen: Screen; check: Check | null };

export const hidden: State = { selection: null, anchor: { x: 0, top: 0, bottom: 0 }, screen: { kind: 'icon' }, languages: [], pairs: [], translation: null, detection: null, check: null, ignored: null, dictation: null };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'select':
      // A different selection is a different question: start over. The grammar check is kept: it
      // answers for a text, not a field, and badge() hides it once the text differs.
      return {
        ...hidden,
        selection: action.selection,
        anchor: action.anchor,
        screen: { kind: 'icon', field: action.field },
        check: state.check,
        ignored: state.ignored?.element === action.selection.element ? state.ignored : null,
      };
    case 'close':
      return state.selection ? { ...hidden, check: state.check, ignored: state.ignored } : state;
    case 'moved':
      return state.selection ? { ...state, anchor: action.anchor } : state;
    case 'ignore': {
      const { selection, ignored } = state;
      if (!selection || (selection.kind === 'page' && !state.dictation)) return state;
      const keys = ignored?.element === selection.element ? ignored.keys : [];
      const next = { ...state, ignored: { element: selection.element, keys: [...keys, editKey(action.edit)] } };
      const { screen } = state;
      if (screen.kind !== 'grammar' || !screen.fix) return next;
      const left = visibleEdits(next, screen.fix).length;
      // The next edit slides into the ignored one's place; none left = back to the field (a dictation stays, for Insert).
      if (!left && !screen.dictated) return { ...next, screen: { kind: 'icon', field: screen.field } };
      return { ...next, screen: { ...screen, index: Math.max(0, Math.min(screen.index, left - 1)) } };
    }
    case 'open':
      return { ...state, screen: { kind: 'languages' }, languages: action.languages, pairs: action.pairs };
    case 'dictated':
      return { ...state, dictation: action.dictation };
    case 'detected':
      return { ...state, detection: action.detection };
    case 'translation':
      return { ...state, translation: action.translation };
    case 'show':
      return state.selection ? { ...state, screen: action.screen } : state;
    case 'checked':
      return { ...state, check: action.check };
    case 'edited':
      return state.selection ? { ...state, selection: action.selection, screen: action.screen, check: action.check } : state;
  }
}

export const isMenuOpen = (state: State): boolean => state.selection !== null && state.screen.kind !== 'icon';

/** The detected code to send as sourceLang, or undefined when there is no real language. */
export const detectedLang = (state: State): string | undefined =>
  typeof state.detection === 'object' && state.detection ? state.detection.lang : undefined;

/**
 * The target of the user's usual pair for the detected language, offered above the list: the most
 * used pair starting from it, else one ending in it, flipped (PL→UA suggests PL for Ukrainian text).
 */
export const pairTarget = (state: State): string | undefined => pairFor(state.pairs, detectedLang(state));

/** The favorites offered as targets: the detected source (a no-op) and the language shown above them are left out. */
export const menuLanguages = (state: State): readonly Language[] => {
  const skip = [detectedLang(state), state.translation?.lang ?? pairTarget(state)];
  return state.languages.filter((language) => !skip.includes(language.code));
};

/** What the digit keys pick, in order: the pair's target (a field's; page text shows it translated instead), then the list. */
export const menuShortcuts = (state: State): string[] => {
  const target = state.selection?.kind === 'page' ? undefined : pairTarget(state);
  return [...(target ? [target] : []), ...menuLanguages(state).map((language) => language.code)];
};

/** One error per edit: `FixGrammarOk.edits` and its html's `span.fix` are the same list. */
export const countFixes = (fix: FixGrammarOk): number => fix.edits.length;

/** What an ignored edit is remembered by: the same suggestion on a re-checked text has new offsets. */
export const editKey = (edit: FixEdit): string => `${edit.original}→${edit.replacement}`;

/**
 * The check after one edit was applied in the field: that edit gone, the later ones shifted by the
 * length change, and its span turned into plain text. Its text is the field's new text, so the
 * input the replacement fires finds it already checked and asks nothing.
 */
export function withoutEdit(check: Check, edit: FixEdit): Check {
  const fix = check.fix && withoutFixEdit(check.fix, edit);
  if (!fix || fix === check.fix) return check;
  return { text: applyEdits(check.text, [edit]), errors: fix.edits.length, fix };
}

/**
 * Where the shown edit went in a newer fix of the same text: the same edit (`editKey`) nearest its
 * old start, else whichever edit is nearest that start. -1 = no edits left.
 */
export function followEdit(shown: FixEdit | undefined, edits: FixEdit[]): number {
  if (!edits.length) return -1;
  if (!shown) return 0;
  const same = edits.some((edit) => editKey(edit) === editKey(shown));
  let best = -1;
  edits.forEach((edit, i) => {
    if (same && editKey(edit) !== editKey(shown)) return;
    if (best < 0 || Math.abs(edit.start - shown.start) < Math.abs(edits[best]!.start - shown.start)) best = i;
  });
  return best;
}

/** The edits of `fix` (the check's by default) the user hasn't ignored in this field. */
export function visibleEdits({ selection, check, ignored }: State, fix = check?.fix): FixEdit[] {
  const edits = fix?.edits ?? [];
  const keys = ignored && ignored.element === selection?.element ? ignored.keys : [];
  return keys.length ? edits.filter((edit) => !keys.includes(editKey(edit))) : edits;
}

/**
 * Underlines are drawn on a multi-line field (textarea, contenteditable) while its corner icon or a
 * hover-opened grammar panel is up, and only while the fix is for the text in it: a stale fix is never drawn.
 */
export function showsUnderlines(state: State): boolean {
  const { screen, selection, check } = state;
  const onField = (screen.kind === 'icon' && !!screen.field) || (screen.kind === 'grammar' && !!screen.hover);
  if (!onField || !selection || selection.kind === 'page' || selection.element?.localName === 'input') return false;
  return !!check?.fix && check.text === selection.text && visibleEdits(state).length > 0;
}

/** A check that found nothing to fix: text the user just applied from a fix is clean by construction, no request needed. */
export const cleanCheck = (text: string): Check => ({ text, errors: 0 });

/**
 * The grammar check of the current text: its error count, 'error' when it failed, 'checking' while
 * in flight, 'layout' when it was typed on the wrong keyboard layout, 'gibberish' for random
 * keystrokes (neither has grammar).
 */
export function grammarCount({ selection, check }: State): number | 'error' | 'checking' | 'layout' | 'gibberish' | undefined {
  if (!check || check.text !== selection?.text) return undefined;
  if (check.verdict) return check.verdict === 'mistyped' ? 'layout' : 'gibberish';
  if (check.error) return 'error';
  return check.errors ?? 'checking';
}

/** What the guard says is off with the current text. There is no waving it off: the API would refuse it anyway. */
export function warning(state: State): 'layout' | 'gibberish' | undefined {
  const count = grammarCount(state);
  return count === 'layout' || count === 'gibberish' ? count : undefined;
}

export const isMistyped = (state: State): boolean => warning(state) === 'layout';

/** Enough words for the background check to be worth a request. A click checks anything. */
export const hasEnoughWords = (text: string): boolean =>
  [...new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text)].filter((s) => s.isWordLike).length >= 3;

/**
 * The icon's badge, only while the check describes the text under it: a wrong layout ('layout') or
 * random keystrokes ('gibberish') on both icons; on the field icon also the error count, or 'error'
 * when the check failed.
 */
export function badge(state: State): number | 'error' | 'layout' | 'gibberish' | undefined {
  if (state.screen.kind !== 'icon') return undefined;
  const warned = warning(state);
  if (warned) return warned;
  if (!state.screen.field) return undefined;
  const count = grammarCount(state);
  return count === 'checking' ? undefined : count;
}

/**
 * The icon spins while its check is in flight -- the field's also right after an edit cancelled
 * one, before the text catches up. A selection icon spins only for its own text; page text is never checked.
 */
export function isChecking({ screen, selection, check }: State): boolean {
  if (screen.kind !== 'icon' || !check || answered(check)) return false;
  return screen.field ? true : selection?.kind !== 'page' && check.text === selection?.text;
}

