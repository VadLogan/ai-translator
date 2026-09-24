import type { FixGrammarOk } from '../../../../shared/contract';
import type { Language } from '../../core/languages';
import type { Anchor, EditableSelection } from '../selection';

/** POST /detect's answer: a language, text typed on the wrong keyboard layout, or no idea. */
export type Detection = { lang: string } | 'mistyped' | 'unknown';

export type Screen =
  /** `field`: the focused field's corner icon, which opens the grammar fix instead of the menu. */
  | { kind: 'icon'; field?: boolean }
  | { kind: 'languages' }
  | { kind: 'busy'; label: string }
  /** `fix` is null while the field's check is still running: the panel shows a skeleton. */
  | { kind: 'grammarFixed'; fix: FixGrammarOk | null }
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
  /** Null until detection answers; it is only asked once the menu opens. */
  detection: Detection | null;
  /** The latest grammar check and the text it ran on; `fix` and `error` both absent = in flight. */
  check: Check | null;
}

export interface Check {
  text: string;
  fix: FixGrammarOk | null;
  error?: { message: string; code?: string };
}

export type Action =
  | { type: 'select'; selection: EditableSelection; anchor: Anchor; field?: boolean }
  | { type: 'close' }
  | { type: 'open'; languages: readonly Language[] }
  | { type: 'detected'; detection: Detection }
  | { type: 'show'; screen: Screen }
  | { type: 'checked'; check: State['check'] };

export const hidden: State = { selection: null, anchor: { x: 0, top: 0, bottom: 0 }, screen: { kind: 'icon' }, languages: [], detection: null, check: null };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'select':
      // A different selection is a different question: start over. The grammar check is kept: it
      // answers for a text, not a field, and badge() hides it once the text differs.
      return { ...hidden, selection: action.selection, anchor: action.anchor, screen: { kind: 'icon', field: action.field }, check: state.check };
    case 'close':
      return state.selection ? { ...hidden, check: state.check } : state;
    case 'open':
      return { ...state, screen: { kind: 'languages' }, languages: action.languages };
    case 'detected':
      return { ...state, detection: action.detection };
    case 'show':
      return state.selection ? { ...state, screen: action.screen } : state;
    case 'checked':
      return { ...state, check: action.check };
  }
}

export const isMenuOpen = (state: State): boolean => state.selection !== null && state.screen.kind !== 'icon';

/** The detected code to send as sourceLang, or undefined when there is no real language. */
export const detectedLang = (state: State): string | undefined =>
  typeof state.detection === 'object' && state.detection ? state.detection.lang : undefined;

/** The favorites offered as targets: the detected source language is left out, translating into it is a no-op. */
export const menuLanguages = (state: State): readonly Language[] => {
  const source = detectedLang(state);
  return state.languages.filter((language) => language.code !== source);
};

/** Each edit in `FixGrammarOk.html` is one `span.fix`; the text around them is escaped, so this can't miscount. */
export const countFixes = (html: string): number => html.match(/<span class="fix"/g)?.length ?? 0;

/** The grammar check of the current text: its error count, 'error' when it failed, 'checking' while in flight. */
export function grammarCount({ selection, check }: State): number | 'error' | 'checking' | undefined {
  if (!check || check.text !== selection?.text) return undefined;
  if (check.error) return 'error';
  return check.fix ? countFixes(check.fix.html) : 'checking';
}

/** The field icon's error count, or 'error' when the check failed -- only while it describes the text in the field. */
export function badge(state: State): number | 'error' | undefined {
  if (state.screen.kind !== 'icon' || !state.screen.field) return undefined;
  const count = grammarCount(state);
  return count === 'checking' ? undefined : count;
}

/** The field icon spins while its check is in flight -- or queued right after an edit cancelled one. */
export const isChecking = ({ screen, check }: State): boolean =>
  screen.kind === 'icon' && !!screen.field && check !== null && check.fix === null && !check.error;

