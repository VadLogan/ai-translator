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
  /** The check found a wrong keyboard layout: offered instead of the grammar panel / menu. */
  /** `field`: opened from the field icon, so dismissing it falls back to the grammar panel, not the menu. */
  | { kind: 'layout'; field?: boolean }
  /** The check found random keystrokes: a notice, with "Check anyway" falling back like the layout card. */
  | { kind: 'notText'; field?: boolean }
  /** A page selection's translation: shown to copy, since page text can't be replaced. */
  | { kind: 'translated'; text: string; lang: string }
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
  /** The user waved off the layout card or the not-text notice for this text: no "!" / "?" for it again. */
  dismissed?: boolean;
}

export type Action =
  | { type: 'select'; selection: EditableSelection; anchor: Anchor; field?: boolean }
  | { type: 'close' }
  | { type: 'open'; languages: readonly Language[] }
  | { type: 'detected'; detection: Detection }
  | { type: 'show'; screen: Screen }
  | { type: 'checked'; check: State['check'] }
  | { type: 'dismissWarning' };

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
    case 'dismissWarning':
      return state.check ? { ...state, check: { ...state.check, dismissed: true } } : state;
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

/**
 * The grammar check of the current text: its error count, 'error' when it failed, 'checking' while
 * in flight, 'layout' when it was typed on the wrong keyboard layout, 'gibberish' for random
 * keystrokes (neither has grammar).
 */
export function grammarCount({ selection, check }: State): number | 'error' | 'checking' | 'layout' | 'gibberish' | undefined {
  if (!check || check.text !== selection?.text) return undefined;
  if (check.error) return 'error';
  if (!check.fix) return 'checking';
  if (check.fix.mistyped) return 'layout';
  return check.fix.gibberish ? 'gibberish' : countFixes(check.fix.html);
}

/** What the check says is off with the current text -- unless the user has waved it off. */
export function warning(state: State): 'layout' | 'gibberish' | undefined {
  const count = grammarCount(state);
  return (count === 'layout' || count === 'gibberish') && !state.check?.dismissed ? count : undefined;
}

export const isMistyped = (state: State): boolean => warning(state) === 'layout';

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
  // A waved-off warning is no count either: it was never grammar.
  return count === 'checking' || count === 'layout' || count === 'gibberish' ? undefined : count;
}

/**
 * The icon spins while its check is in flight -- the field's also right after an edit cancelled
 * one, before the text catches up. A selection icon spins only for its own text; page text is never checked.
 */
export function isChecking({ screen, selection, check }: State): boolean {
  if (screen.kind !== 'icon' || !check || check.fix || check.error) return false;
  return screen.field ? true : selection?.kind !== 'page' && check.text === selection?.text;
}

