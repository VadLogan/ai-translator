import { useEffect, useReducer, useRef, useSyncExternalStore } from 'react';
import type { RewriteStyle } from '../../../../shared/contract';
import { layoutLanguages, switchLayout } from '../../core/layout';
import { findLanguage, type Language } from '../../core/languages';
import { PROVIDERS, isProviderId } from '../../auth/providers';
import { sendMessage } from '../../messaging/messages';
import { storageSettings } from '../../settings/storage-settings';
import { replaceSelection } from '../replace';
import { getEditableSelection, getFieldAnchor, getFocusedField, getPageSelection, getSelectionAnchor, isSelectionUnchanged, wholeField } from '../selection';
import { TranslatorWidget, type WidgetView } from './TranslatorWidget';
import { badge, countFixes, detectedLang, grammarCount, isChecking, hidden, isMenuOpen, menuLanguages, reducer, type Detection, type Screen, type State } from './translator-state';

export interface TranslatorProps {
  /** The shadow host: events inside it are the widget's own, not "outside clicks". */
  host: HTMLElement;
  /** Puts the host in the page. Called before the first show, so nothing is injected until needed. */
  mount: () => void;
  /**
   * After an extension reload or update this script is orphaned: every chrome.* call throws
   * "Extension context invalidated". Reading WXT's ctx.isInvalid lets it notice and tear us down.
   */
  isInvalid: () => boolean;
}

/**
 * Two flows: a selection gets the icon → menu → translate flow; a focused field with nothing
 * selected gets a corner icon → grammar fix → replace the whole field. TranslatorWidget only renders what this decides. */
export function Translator({ host, mount, isInvalid }: TranslatorProps) {
  const [state, dispatch] = useReducer(reducer, hidden);
  // Event handlers and async answers read the latest state through this, not a stale closure.
  const latest = useRef(state);
  latest.current = state;
  // Bumped on every close and new translation, so answers that arrive afterwards are ignored.
  const generation = useRef(0);
  // The pending background grammar check; typing restarts it.
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The one check in flight, if any: its id cancels it, its text dedupes it. Cleared once it answers.
  const pendingCheck = useRef<{ id: string; text: string } | null>(null);
  const dark = useSyncExternalStore(subscribeDark, () => darkQuery().matches);

  const show = (screen: Screen) => dispatch({ type: 'show', screen });
  const fail = (message: string, back: 'menu' | 'close' = 'menu') => show({ kind: 'error', message, back });

  function close(): void {
    clearTimeout(checkTimer.current);
    generation.current++;
    dispatch({ type: 'close' });
  }

  function refresh(): void {
    if (isInvalid() || isMenuOpen(latest.current)) return;
    // Page text last: a selection inside a field is the field's.
    const selection = getEditableSelection() ?? getPageSelection();
    if (selection) {
      mount();
      dispatch({ type: 'select', selection, anchor: getSelectionAnchor(selection) });
      // Checked up front, so the icon can warn about a wrong layout before it is clicked. Page text
      // can't be replaced, so it isn't checked.
      if (selection.kind !== 'page') scheduleCheck(300);
      return;
    }
    const field = getFocusedField();
    if (!field) return close();
    mount();
    dispatch({ type: 'select', selection: field, anchor: getFieldAnchor(field), field: true });
  }

  async function openMenu(): Promise<void> {
    const id = generation.current;
    let favorites: string[];
    try {
      // The cache answers immediately; the menu must not wait on the network to open.
      favorites = (await storageSettings.get()).favoriteLanguages;
    } catch {
      // Only fails when the extension was reloaded while the icon was showing.
      return fail('The extension was updated. Reload the page.', 'close');
    }
    if (id !== generation.current) return;
    dispatch({ type: 'open', languages: favorites.map(findLanguage).filter((l): l is Language => l !== undefined) });
    if (!latest.current.detection) void detect(id);
    // The menu's "Grammar fix" item shows the selection's error count, so it is asked up front.
    // Page text can't be replaced, so it gets no grammar fix.
    const { selection } = latest.current;
    if (selection?.kind !== 'page') void checkGrammar(selection);
  }

  /** Fills in the menu's detected line. Failures stay silent -- translating does not depend on it. */
  async function detect(id: number): Promise<void> {
    const { selection } = latest.current;
    if (!selection) return;
    const response = await sendMessage({ type: 'detect', text: selection.text });
    if (id !== generation.current) return;
    dispatch({ type: 'detected', detection: toDetection(response.ok ? response.data : null) });
  }

  async function translate(targetLang: string): Promise<void> {
    const { selection } = latest.current;
    if (!selection) return;
    const id = ++generation.current;
    const sourceLang = detectedLang(latest.current);
    show({ kind: 'busy', label: `${findLanguage(targetLang)?.translating ?? `Translating to ${targetLang}`}…` });

    // sourceLang is what the user translated with, so the API can mark the detection verified.
    const response = await sendMessage({ type: 'translate', text: selection.text, targetLang, ...(sourceLang ? { sourceLang } : {}) });
    if (id !== generation.current) return;

    if (!response.ok) {
      if (response.error.code === 'unauthenticated') show({ kind: 'signIn', targetLang });
      else fail(response.error.message);
    } else if (selection.kind === 'page') {
      show({ kind: 'translated', text: response.data.text, lang: targetLang });
    } else if (!isSelectionUnchanged(selection)) {
      fail('The text changed while translating. Select it again.');
    } else {
      replaceSelection(selection, response.data.text);
      close();
    }
  }

  /** The API rejected us: sign in, then resume what was interrupted -- a translation or the grammar check. */
  async function signIn(provider: string, targetLang?: string): Promise<void> {
    if (!isProviderId(provider)) return;
    show({ kind: 'busy', label: 'Signing in…' });
    const response = await sendMessage({ type: 'sign-in', provider });
    if (!response.ok) return fail(response.error.message);
    if (targetLang) return void translate(targetLang);
    dispatch({ type: 'checked', check: null }); // the failed check is stale now: ask again
    fixGrammar();
  }

  /** Re-types the selection on the other keyboard layout. No API call, no translation. */
  function fixLayout(): void {
    const { selection } = latest.current;
    if (!selection || selection.kind === 'page') return;
    if (!isSelectionUnchanged(selection)) return fail('The text changed. Select it again.');
    replaceSelection(selection, switchLayout(selection.text));
    close();
    // close() dropped the check the replacement's input scheduled; the fixed text gets its own. Deferred: after the close renders.
    setTimeout(() => {
      refresh();
      scheduleCheck();
    }, 0);
  }

  /**
   * The icon's click. Never asks the API itself: it opens the panel on the check the field's input
   * already started, as a skeleton until that answers. Re-read now, not at focus: the user kept
   * typing. From the element, not from focus: pressing the icon moves focus into the widget.
   */
  function fixGrammar(): void {
    const field = wholeField(latest.current.selection?.element ?? null);
    if (!field?.text.trim()) return fail('Type something first.', 'close');
    const { check } = latest.current;
    dispatch({ type: 'select', selection: field, anchor: getFieldAnchor(field), field: true });
    if (check?.text === field.text && check.error) return showCheckError(check.error);
    show({ kind: 'grammarFixed', fix: check?.text === field.text ? check.fix : null });
    // Clicked inside the debounce: start the check now rather than after the pause.
    clearTimeout(checkTimer.current);
    void checkGrammar();
  }

  /**
   * The icon's click. A text the check found mistyped opens the layout card, random keystrokes the
   * not-text notice -- instead of the grammar panel (field) or the menu (selection).
   */
  function openFromIcon(): void {
    const { screen, selection, check } = latest.current;
    const field = screen.kind === 'icon' && !!screen.field;
    const current = field ? wholeField(selection?.element ?? null) : selection;
    const fix = current && check?.text === current.text && !check.dismissed ? check.fix : null;
    if (!current || !(fix?.mistyped || fix?.gibberish)) return void (field ? fixGrammar() : openMenu());
    if (field) dispatch({ type: 'select', selection: current, anchor: getFieldAnchor(current), field: true });
    show({ kind: fix.mistyped ? 'layout' : 'notText', field });
  }

  /** The layout card's ✕ or the notice's "Check anyway": the regular widget takes their place. */
  function dismissWarning(field: boolean): void {
    dispatch({ type: 'dismissWarning' });
    if (field) fixGrammar();
    else void openMenu();
  }

  /** The menu's "Grammar fix" item: the grammar panel for the selection, not the whole field. */
  function openGrammar(): void {
    const { selection, check } = latest.current;
    if (!selection || selection.kind === 'page') return;
    const mine = check?.text === selection.text ? check : null;
    if (mine?.error) return showCheckError(mine.error);
    show({ kind: 'grammarFixed', fix: mine?.fix ?? null });
    void checkGrammar(selection); // a no-op while it is in flight or answered
  }

  function showCheckError(error: { message: string; code?: string }): void {
    if (error.code === 'unauthenticated') show({ kind: 'signIn' });
    else fail(error.message, 'close');
  }

  /**
   * One check per text, driven by the field's input: it spins the icon, then badges the error count
   * and fills an open skeleton panel. Edits cancel it (onInput); a failure badges the icon.
   */
  async function checkGrammar(field = wholeField(latest.current.selection?.element ?? null)): Promise<void> {
    const { check } = latest.current;
    if (!field?.text.trim()) return;
    if (pendingCheck.current?.text === field.text || (check?.text === field.text && check.fix)) return; // asked already
    cancelCheck();
    const id = crypto.randomUUID();
    pendingCheck.current = { id, text: field.text };
    dispatch({ type: 'checked', check: { text: field.text, fix: null } });
    const answer = await sendMessage({ type: 'fix-grammar', text: field.text, id });
    // Cancelled, or overtaken by a newer text: answers can arrive out of order.
    if (pendingCheck.current?.id !== id) return;
    pendingCheck.current = null;
    const done = answer.ok ? { text: field.text, fix: answer.data } : { text: field.text, fix: null, error: answer.error };
    dispatch({ type: 'checked', check: done });
    const now = latest.current;
    if (now.screen.kind === 'icon' && now.screen.field) {
      // Re-select: a paste or autocomplete changes the text with no keyup to refresh it.
      const current = wholeField(field.element);
      if (current) dispatch({ type: 'select', selection: current, anchor: getFieldAnchor(current), field: true });
    } else if (now.screen.kind === 'grammarFixed' && !now.screen.fix && now.selection?.text === field.text) {
      if (!answer.ok) showCheckError(answer.error);
      else if (answer.data.mistyped) show({ kind: 'layout', field: true });
      else if (answer.data.gibberish) show({ kind: 'notText', field: true });
      else show({ kind: 'grammarFixed', fix: answer.data });
    }
  }

  function cancelCheck(): void {
    const pending = pendingCheck.current;
    if (!pending) return;
    pendingCheck.current = null;
    void sendMessage({ type: 'cancel', id: pending.id });
  }

  /** Debounced: one check per pause in typing (or per settled selection), not per keystroke. */
  function scheduleCheck(delay = 500): void {
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(() => {
      const { screen, selection } = latest.current;
      if ((screen.kind === 'icon' && screen.field) || screen.kind === 'grammarFixed') void checkGrammar();
      // A selection's own text, not its whole field. An open menu asks for itself (openMenu).
      else if (screen.kind === 'icon' && selection && selection.kind !== 'page') void checkGrammar(selection);
    }, delay);
  }

  /**
   * The field changed. A check for the old text is cancelled at once, not after the pause, and the
   * icon keeps spinning into the next one. Emptied: nothing to check, the panel closes. An open
   * panel follows the text back to a skeleton.
   */
  function onInput(): void {
    const { selection, screen } = latest.current;
    const field = wholeField(selection?.element ?? null);
    if (!field) return scheduleCheck();
    const wasChecking = pendingCheck.current !== null && pendingCheck.current.text !== field.text;
    if (wasChecking) cancelCheck();
    if (!field.text.trim()) {
      clearTimeout(checkTimer.current);
      dispatch({ type: 'checked', check: null });
      if (screen.kind === 'grammarFixed') close();
      return;
    }
    if (screen.kind === 'grammarFixed') {
      dispatch({ type: 'select', selection: field, anchor: getFieldAnchor(field), field: true });
      show({ kind: 'grammarFixed', fix: null });
    }
    if (wasChecking || screen.kind === 'grammarFixed') dispatch({ type: 'checked', check: { text: field.text, fix: null } });
    scheduleCheck();
  }

  /** Rewrites the field's original text; the rewrite fixes errors along the way. */
  async function rewrite(style: RewriteStyle): Promise<void> {
    const { selection } = latest.current;
    if (!selection) return;
    const id = ++generation.current;
    show({ kind: 'busy', label: 'Rewriting…' });
    const response = await sendMessage({ type: 'rewrite', text: selection.text, style });
    if (id !== generation.current) return;
    if (!response.ok) fail(response.error.message, 'close');
    else apply(response.data.text);
  }

  function apply(text: string): void {
    const { selection } = latest.current;
    if (!selection || selection.kind === 'page') return;
    if (!isSelectionUnchanged(selection)) return fail('The text changed. Try again.', 'close');
    replaceSelection(selection, text);
    close();
  }

  // The handlers above only touch refs and dispatch, so subscribing once is enough.
  useEffect(() => {
    const owns = (event: Event) => event.composedPath().includes(host);
    const listeners: [EventTarget, string, (event: Event) => void, AddEventListenerOptions?][] = [
      [document, 'mousedown', (event) => !owns(event) && close()],
      // Deferred: let the browser finalize the selection first.
      [document, 'mouseup', (event) => !owns(event) && setTimeout(refresh, 0)],
      [
        document,
        'keydown',
        (event) => {
          const { key } = event as KeyboardEvent;
          if (key === 'Escape') return close();
          if (latest.current.screen.kind === 'layout' && key === 'f') {
            event.preventDefault();
            event.stopPropagation();
            return fixLayout();
          }
          // Grammar panel shortcuts. Captured and swallowed, or the field would get the keystroke too.
          const { screen } = latest.current;
          // A skeleton panel has nothing to apply yet, so the keys stay the field's.
          // Clean text offers no Replace, so its Enter stays the field's (in Teams, Enter sends).
          const keys = screen.kind === 'grammarFixed' && screen.fix && countFixes(screen.fix.html) > 0 ? ['Enter', 'n', 'o'] : ['n', 'o'];
          if (screen.kind === 'grammarFixed' && screen.fix && keys.includes(key)) {
            event.preventDefault();
            event.stopPropagation();
            if (key === 'Enter') apply(screen.fix.text);
            else void rewrite(key === 'n' ? 'natural' : 'formal');
            return;
          }
          // Menu shortcut badges: "1".."9" pick the matching favorite language.
          const language = /^[1-9]$/.test(key) && isMenuOpen(latest.current) ? menuLanguages(latest.current)[Number(key) - 1] : undefined;
          if (language) void translate(language.code);
        },
        { capture: true },
      ],
      [document, 'input', (event) => !owns(event) && onInput(), { capture: true }],
      // Model-based editors (CKEditor in Teams, ProseMirror, Lexical) cancel beforeinput and edit
      // the DOM themselves, so `input` never fires there. Deferred: the text changes after this event.
      // Plain fields get both; onInput is idempotent for the same text.
      [document, 'beforeinput', (event) => !owns(event) && setTimeout(onInput, 0), { capture: true }],
      // Focus alone (tabbing in, or clicking an empty field) shows the field's corner icon.
      // A field focused with text already in it is checked too, so its icon is ready before typing.
      [
        document,
        'focusin',
        (event) => {
          if (owns(event)) return;
          setTimeout(refresh, 0);
          scheduleCheck();
        },
      ],
      // Pressing the icon moves focus into the widget; that is not leaving the field.
      [document, 'focusout', (event) => (event as FocusEvent).relatedTarget !== host && setTimeout(refresh, 0)],
      // Deferred like mouseup: model-based editors (Lexical, ProseMirror) move the selection after
      // the key event, so reading it synchronously would miss it.
      [document, 'keyup', (event) => (event as KeyboardEvent).key !== 'Escape' && setTimeout(refresh, 0)],
      // Close only when the scroll moves the selected field: pages like Teams scroll unrelated panes
      // (chat list, typing indicators) constantly, which would otherwise kill the menu.
      [
        window,
        'scroll',
        (event) => {
          const { target } = event;
          const field = latest.current.selection?.element;
          if (field && (target === document || (target instanceof Node && target.contains(field)))) close();
        },
        { capture: true, passive: true },
      ],
      [window, 'resize', () => close()],
    ];
    for (const [target, type, listener, options] of listeners) target.addEventListener(type, listener, options);
    return () => {
      clearTimeout(checkTimer.current);
      for (const [target, type, listener, options] of listeners) target.removeEventListener(type, listener, options);
    };
  }, []);

  if (!state.selection) return null;
  return (
    <TranslatorWidget
      view={toView(state, {
        onPick: signIn,
        onBack: () => (state.screen.kind === 'error' && state.screen.back === 'close' ? close() : void openMenu()),
        onReplace: apply,
        onClose: close,
        onRewrite: (style) => void rewrite(style),
        onDismissWarning: dismissWarning,
      })}
      anchor={state.anchor}
      dark={dark}
      callbacks={{
        onIconClick: openFromIcon,
        onLanguagePick: (code) => void translate(code),
        onFixLayout: fixLayout,
        onFixGrammar: openGrammar,
        onOpenSettings: () => {
          close();
          void sendMessage({ type: 'open-options' });
        },
      }}
    />
  );
}

/** Maps the flow's state onto what the presentational widget renders. */
function toView(
  state: State,
  {
    onPick,
    onBack,
    onReplace,
    onRewrite,
    onClose,
    onDismissWarning,
  }: {
    onPick: (provider: string, targetLang?: string) => void;
    onBack: () => void;
    onReplace: (text: string) => void;
    onRewrite: (style: RewriteStyle) => void;
    onClose: () => void;
    onDismissWarning: (field: boolean) => void;
  },
): WidgetView {
  const { screen, selection, detection } = state;
  switch (screen.kind) {
    case 'icon':
      return { kind: 'icon', field: screen.field, badge: badge(state), checking: isChecking(state) };
    case 'languages': {
      // The layout item is the exception, not a menu fixture: only when detect says the text was mistyped.
      const mistyped = detection === 'mistyped' || grammarCount(state) === 'layout';
      const fixed = selection && mistyped ? switchLayout(selection.text) : '';
      return {
        kind: 'languages',
        languages: menuLanguages(state),
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
    case 'grammarFixed': {
      const { fix } = screen;
      return {
        kind: 'grammarFixed',
        html: fix?.html,
        onReplace: () => fix && onReplace(fix.text),
        onCopy: () => fix && void navigator.clipboard.writeText(fix.text).then(onClose),
        onRewrite,
      };
    }
    case 'layout': {
      const typed = selection?.text ?? '';
      return { kind: 'layout', typed, fixed: switchLayout(typed), ...layoutLanguages(typed), onDismiss: () => onDismissWarning(!!screen.field) };
    }
    case 'notText':
      return { kind: 'notText', onContinue: () => onDismissWarning(!!screen.field) };
    case 'translated':
      return {
        kind: 'translated',
        text: screen.text,
        lang: screen.lang,
        onCopy: () => void navigator.clipboard.writeText(screen.text).then(onClose),
      };
    case 'signIn':
      return { kind: 'signIn', providers: PROVIDERS, onPick: (provider) => onPick(provider, screen.targetLang) };
    case 'error':
      return { kind: 'error', message: screen.message, onBack };
  }
}

/** "und" is the provider saying it could not tell, so it must not travel on as a sourceLang. */
function toDetection(answer: { lang: string; mistyped?: boolean } | null): Detection {
  if (answer?.mistyped) return 'mistyped';
  return answer && answer.lang !== 'und' ? { lang: answer.lang } : 'unknown';
}

const languageName = (code: string): string => findLanguage(code)?.name ?? code;

const preview = (text: string): string => (text.length > 28 ? `${text.slice(0, 28)}…` : text);

const darkQuery = () => matchMedia('(prefers-color-scheme: dark)');

function subscribeDark(onChange: () => void): () => void {
  const query = darkQuery();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
