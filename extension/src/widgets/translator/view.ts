import type { DetectOk, FixEdit, FixKind } from '../../../../shared/contract';
import { PROVIDERS } from '../../auth/providers';
import { layoutLanguages, switchLayout } from '../../core/layout';
import { findLanguage, languageName, type Language } from '../../core/languages';
import type { Response } from '../../messaging/messages';
import { plainText } from '../../content/selection';
import type { Badge } from '../../components/CountBadge';
import { badge, detectedLang, grammarCount, isChecking, isVerdict, menuLanguages, pairTarget, visibleEdits, type Check, type Detection, type State } from './state';

export interface WidgetCallbacks {
  onIconClick(): void;
  onLanguagePick(code: string): void;
  onFixLayout(): void;
  onFixGrammar(): void;
  onOpenSettings(): void;
  /** The hover pill's "Turn off in this field". */
  onDisableField(): void;
}

/** Everything the widget can be showing. toView derives it from the flow's state. */
export type WidgetView =
  | { kind: 'hidden' }
  /** `field`: sits in the focused field's bottom-right corner instead of above the selection. */
  /** `badge`: errors the background grammar check found; 0 = clean, 'error' = the check failed, absent = not checked. */
  /** 'layout' = typed on the wrong keyboard layout, 'gibberish' = random keystrokes; both on either icon. */
  /** `canDisable`: the icon belongs to a field, so hovering it offers "Turn off in this field". `hovered` opens that pill up front (Storybook). */
  | { kind: 'icon'; field?: boolean; badge?: Badge; checking?: boolean; canDisable?: boolean; hovered?: boolean }
  | {
    kind: 'languages';
    languages: readonly Language[];
    /** A field's usual pair target for the detected language, shown above the list as shortcut 1. */
    suggested?: Language;
    /**
     * Page text: the translation under the detected line. `lines`: skeleton lines sized to the
     * selection while it loads; `text` once it answers, `error` if it failed.
     */
    translation?: { lang: string; text?: string; error?: string; lines: number; onCopy: () => void };
    /** The selection re-typed on the other keyboard layout, offered as a menu item. */
    layoutPreview?: string;
    /** Left out while POST /detect is still in flight, detection failed, or the text was mistyped. */
    detectedName?: string;
    /** The detected language code, e.g. "en" -- present only alongside a real detectedName. */
    detectedLang?: string;
    /** The selection's grammar check: its error count, or still running. 'error' and 'layout' hide the item. */
    grammar?: number | 'error' | 'checking' | 'layout' | 'gibberish';
    /** Page text, not a field: nothing can be replaced, so only the languages are offered. */
    readOnly?: boolean;
  }
  | { kind: 'busy'; label: string }
  /**
   * The grammar panel, one edit at a time. `html`: `FixGrammarOk.html`, escaped text with each edit
   * wrapped in `<span class="fix" data-original>`; absent while the fix is loading (a skeleton).
   * `edits` are the ones still showing, in `html`'s span order minus the ignored ones; `index` is the
   * shown one. `ignored` are the span positions to draw as their original text.
   */
  | {
    kind: 'grammar';
    html?: string;
    /** The text's language code, for the preview's `lang`. */
    lang?: string;
    edits: readonly { kind: FixKind; original: string; replacement: string; reason: string }[];
    index: number;
    ignored: readonly number[];
    onReplace: () => void;
    onIgnore: () => void;
    onReplaceAll: () => void;
    onStep: (index: number) => void;
  }
  /**
   * Wrong keyboard layout: `typed` as it is, `fixed` re-typed on the other layout. `from` is what it
   * reads as, `to` the language of the fix. The card's button is `callbacks.onFixLayout`; ✕ only
   * closes -- the API refuses the text as typed, so there is nothing else to fall back to.
   */
  | { kind: 'layout'; typed: string; fixed: string; from: string; to: string; onClose: () => void }
  /** Random keystrokes: a notice, nothing to press. Everything stays off until the text changes. */
  | { kind: 'notText' }
  | { kind: 'signIn'; providers: readonly { id: string; name: string }[]; onPick: (id: string) => void }
  | { kind: 'error'; message: string; onBack: () => void };

/** The flow's actions a view needs to wire into its buttons. */
export interface ViewActions {
  onPick: (provider: string, targetLang?: string) => void;
  onBack: () => void;
  onClose: () => void;
  onReplaceEdit: (edit: FixEdit) => void;
  onIgnoreEdit: (edit: FixEdit) => void;
  onReplaceAll: () => void;
  onStep: (index: number) => void;
}

/** Maps the flow's state onto what the presentational widget renders. */
export function toView(state: State, { onPick, onBack, onClose, onReplaceEdit, onIgnoreEdit, onReplaceAll, onStep }: ViewActions): WidgetView {
  const { screen, selection, detection } = state;
  switch (screen.kind) {
    case 'icon':
      return { kind: 'icon', field: screen.field, badge: badge(state), checking: isChecking(state), canDisable: !!selection && selection.kind !== 'page' };
    case 'languages': {
      // The layout item is the exception, not a menu fixture: only when detect says the text was mistyped.
      const mistyped = detection === 'mistyped' || grammarCount(state) === 'layout';
      const fixed = selection && mistyped ? switchLayout(selection.text) : '';
      return {
        kind: 'languages',
        languages: menuLanguages(state),
        suggested: selection?.kind === 'page' ? undefined : findLanguage(pairTarget(state) ?? ''),
        translation: state.translation ? {
          ...state.translation,
          lines: Math.min(5, Math.ceil((selection?.text.length ?? 0) / 40)) || 1,
          onCopy: () => void navigator.clipboard.writeText(state.translation?.text ?? '').then(onClose),
        } : undefined,
        layoutPreview: fixed && fixed !== selection?.text ? preview(fixed) : undefined,
        detectedName:
          detection === null ? undefined : detection === 'mistyped' ? 'wrong keyboard layout' : detection === 'unknown' ? 'unknown' : languageName(detection.lang),
        detectedLang: detectedLang(state),
        grammar: grammarCount(state),
        readOnly: selection?.kind === 'page',
      };
    }
    case 'busy':
      return { kind: 'busy', label: screen.label };
    case 'grammar': {
      const { fix, index } = screen;
      const edits = fix ? visibleEdits(state, fix) : [];
      const current = edits[index];
      return {
        kind: 'grammar',
        html: fix ? plainText(selection, fix.html) : undefined,
        edits: edits.map(({ kind, original, replacement, reason }) => ({ kind, original: plainText(selection, original), replacement: plainText(selection, replacement), reason })),
        index,
        ignored: fix ? fix.edits.flatMap((edit, i) => (edits.includes(edit) ? [] : [i])) : [],
        onReplace: () => current && onReplaceEdit(current),
        onIgnore: () => current && onIgnoreEdit(current),
        onReplaceAll,
        onStep,
      };
    }
    case 'layout': {
      const typed = selection?.text ?? '';
      return { kind: 'layout', typed, fixed: switchLayout(typed), ...layoutLanguages(typed), onClose };
    }
    case 'notText':
      return { kind: 'notText' };
    case 'signIn':
      return { kind: 'signIn', providers: PROVIDERS, onPick: (provider) => onPick(provider, screen.targetLang) };
    case 'error':
      return { kind: 'error', message: screen.message, onBack };
  }
}

/**
 * The guard's 422 `mistyped` is a detection too: it puts the layout item in the menu. A failure is
 * just "unknown", and so is "und", which must not travel on as a sourceLang.
 */
export function toDetection(response: Response<DetectOk>): Detection {
  if (!response.ok) return response.error.code === 'mistyped' ? 'mistyped' : 'unknown';
  return response.data.lang !== 'und' ? { lang: response.data.lang } : 'unknown';
}

/** A check's answer: the count, the guard's verdict (a 422), or the failure. */
export function toCheck(text: string, answer: Response<{ errors: number }>): Check {
  if (answer.ok) return { text, errors: answer.data.errors };
  const { code } = answer.error;
  return isVerdict(code) ? { text, verdict: code } : { text, error: answer.error };
}

const preview = (text: string): string => (text.length > 28 ? `${text.slice(0, 28)}…` : text);
