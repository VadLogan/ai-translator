import { useEffect, useReducer, useRef, useState } from 'react';
import type { RewriteStyle } from '../../../../../shared/contract';
import { isProviderId } from '../../../auth/providers';
import { switchLayout } from '../../../core/layout';
import { findLanguage, type Language } from '../../../core/languages';
import { sendMessage } from '../../../messaging/messages';
import { historyStore, intoLanguages, topPairs, type HistoryEntry } from '../../../settings/history';
import { pinnedLanguages } from '../../../settings/pinned';
import { storageSettings } from '../../../settings/storage-settings';
import { replaceSelection } from '../../../content/replace';
import { fieldKey, fieldLabel, getEditableSelection, getFieldAnchor, getFocusedField, getPageSelection, getSelectionAnchor, isSelectionUnchanged, plainText, wholeField, type EditableSelection } from '../../../content/selection';
import { answered, cleanCheck, countFixes, detectedLang, hasEnoughWords, hidden, isMenuOpen, isVerdict, menuShortcuts, pairTarget, reducer, type Check, type Screen, type Verdict } from '../state';
import { toCheck, toDetection, type ViewActions, type WidgetCallbacks } from '../view';
import { requestSlot } from './requestSlot';
import { usePageEvents } from './usePageEvents';
import { useSiteGate } from './useSiteGate';

export interface FlowOptions {
  /** The shadow host: events inside it are the widget's own, not "outside clicks". */
  host: HTMLElement;
  /** Puts the host in the page (inside `near`'s popup, if any). Called before each show, so nothing is injected until needed. */
  mount: (near: Element) => void;
  /**
   * After an extension reload or update this script is orphaned: every chrome.* call throws
   * "Extension context invalidated". Reading WXT's ctx.isInvalid lets it notice and tear us down.
   */
  isInvalid: () => boolean;
}

/**
 * The widget's behavior. Two flows: a selection gets the icon → menu → translate flow; a focused
 * field with nothing selected gets a corner icon → grammar fix → replace the whole field. Returns
 * the state and the actions the view wires to its buttons; it renders nothing itself.
 */
export function useTranslatorFlow({ host, mount, isInvalid }: FlowOptions) {
  const [state, dispatch] = useReducer(reducer, hidden);
  // Event handlers and async answers read the latest state through this, not a stale closure.
  const latest = useRef(state);
  latest.current = state;
  // Bumped on every close and new translation, so answers that arrive afterwards are ignored.
  const generation = useRef(0);
  // The pending background grammar check; typing restarts it.
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancel = (id: string) => void sendMessage({ type: 'cancel', id });
  // The one background check (POST /check) in flight, and the one fix (POST /fix-grammar) a click asked for.
  const [pendingCheck] = useState(() => requestSlot(cancel));
  const [pendingFix] = useState(() => requestSlot(cancel));
  // Page text's translation field: one language in flight; picking another aborts it.
  const [pendingTranslation] = useState(() => requestSlot(cancel));
  const gate = useSiteGate(() => close());

  const show = (screen: Screen) => dispatch({ type: 'show', screen });
  const fail = (message: string, back: 'menu' | 'close' = 'menu') => show({ kind: 'error', message, back });

  function close(): void {
    clearTimeout(checkTimer.current);
    generation.current++;
    pendingTranslation.abort();
    dispatch({ type: 'close' });
    dropOrphanCheck();
  }

  /** A 'checking' placeholder with no request behind it (an edit cancelled it, then no check followed) would spin forever. */
  function dropOrphanCheck(): void {
    const { check } = latest.current;
    if (check && !answered(check) && pendingCheck.text === undefined) dispatch({ type: 'checked', check: null });
  }

  function refresh(): void {
    if (gate.siteDisabled.current) return close();
    if (isInvalid() || isMenuOpen(latest.current)) return;
    // Page text last: a selection inside a field is the field's.
    const selection = getEditableSelection() ?? getPageSelection();
    if (selection && selection.kind !== 'page' && gate.offFields.current.has(fieldKey(selection.element))) return close();
    if (selection) {
      mount(selection.element);
      dispatch({ type: 'select', selection, anchor: getSelectionAnchor(selection) });
      // Checked up front, so the icon can warn about a wrong layout before it is clicked. Page text
      // can't be replaced, so it isn't checked.
      if (selection.kind !== 'page') scheduleCheck(300);
      return;
    }
    const field = getFocusedField();
    if (!field || gate.offFields.current.has(fieldKey(field.element))) return close();
    mount(field.element);
    dispatch({ type: 'select', selection: field, anchor: getFieldAnchor(field), field: true });
  }

  async function openMenu(): Promise<void> {
    const id = generation.current;
    let codes: string[];
    let pairs: ReturnType<typeof topPairs>;
    try {
      // The cache and the local history answer immediately; the menu must not wait on the network to open.
      const [{ favoriteLanguages }, history, pinned] = await Promise.all([storageSettings.get(), historyStore.get(), pinnedLanguages.get()]);
      // The same targets as the popup's "Translate into": the pins, the most used favorites, then "Used lately".
      const { yours, lately } = intoLanguages(favoriteLanguages, history, pinned);
      codes = [...yours, ...lately.map(({ code }) => code)];
      pairs = topPairs(history, Infinity);
    } catch {
      // Only fails when the extension was reloaded while the icon was showing.
      return fail('The extension was updated. Reload the page.', 'close');
    }
    if (id !== generation.current) return;
    dispatch({ type: 'open', languages: codes.map(findLanguage).filter((l): l is Language => l !== undefined), pairs });
    if (!latest.current.detection) void detect(id);
    // The menu's "Grammar fix" item shows the selection's error count, so it is asked up front.
    // Page text can't be replaced, so it gets no grammar fix.
    const { selection } = latest.current;
    // Under 3 words the item shows no count and asks when clicked (openGrammar).
    if (selection && selection.kind !== 'page' && hasEnoughWords(selection.text)) void checkGrammar(selection);
  }

  /**
   * Fills in the menu's detected line. Failures stay silent -- translating does not depend on it.
   * Page text in a language the user has a pair for is translated at once into the pair's target,
   * into the field under that line; the menu stays. A field's own text waits for a pick.
   */
  async function detect(id: number): Promise<void> {
    const { selection } = latest.current;
    if (!selection) return;
    const response = await sendMessage({ type: 'detect', text: selection.text });
    if (id !== generation.current) return;
    if (!response.ok && response.error.code === 'gibberish') return showVerdict(selection.text, 'gibberish');
    const detection = toDetection(response);
    dispatch({ type: 'detected', detection });
    if (selection.kind !== 'page' || typeof detection !== 'object' || latest.current.translation) return; // a pick got there first
    // latest.current renders the detection only later, so the pair is looked up on it by hand.
    const target = pairTarget({ ...latest.current, detection });
    if (target) void translateInField(target, detection.lang);
  }

  async function translate(targetLang: string, sourceLang = detectedLang(latest.current)): Promise<void> {
    const { selection } = latest.current;
    if (!selection) return;
    if (selection.kind === 'page') return translateInField(targetLang, sourceLang);
    const id = ++generation.current;
    show({ kind: 'busy', label: `${findLanguage(targetLang)?.translating ?? `Translating to ${targetLang}`}…` });

    // sourceLang is what the user translated with, so the API can mark the detection verified.
    const response = await sendMessage({ type: 'translate', text: selection.text, targetLang, ...(sourceLang ? { sourceLang } : {}) });
    if (id !== generation.current) return;

    if (!response.ok) {
      const { code, message } = response.error;
      if (code === 'unauthenticated') show({ kind: 'signIn', targetLang });
      else if (isVerdict(code)) showVerdict(selection.text, code, message);
      else fail(message);
      return;
    }
    const from = sourceLang ?? response.data.detectedSourceLang;
    const entry = { text: selection.text, result: response.data.text, to: targetLang, ...(from ? { from } : {}) };
    if (!isSelectionUnchanged(selection)) {
      fail('The text changed while translating. Select it again.');
    } else {
      replaceSelection(selection, response.data.text);
      close();
      remember(entry, selection);
    }
  }

  /**
   * Page text is never replaced: its translation fills the field under the menu's detected line,
   * skeleton first. A pick while one is in flight aborts it and swaps the field's language.
   */
  async function translateInField(targetLang: string, sourceLang = detectedLang(latest.current)): Promise<void> {
    const { selection, screen } = latest.current;
    if (!selection) return;
    pendingTranslation.abort();
    const id = pendingTranslation.start(selection.text);
    if (screen.kind !== 'languages') show({ kind: 'languages' }); // back from sign-in or an error
    dispatch({ type: 'translation', translation: { lang: targetLang } });
    const response = await sendMessage({ type: 'translate', text: selection.text, targetLang, id, ...(sourceLang ? { sourceLang } : {}) });
    if (!pendingTranslation.isCurrent(id)) return; // aborted: closed, or another language picked
    pendingTranslation.done();
    if (!response.ok) {
      const { code, message } = response.error;
      if (code === 'unauthenticated') show({ kind: 'signIn', targetLang });
      else if (isVerdict(code)) showVerdict(selection.text, code, message);
      else dispatch({ type: 'translation', translation: { lang: targetLang, error: message } });
      return;
    }
    dispatch({ type: 'translation', translation: { lang: targetLang, text: response.data.text } });
    const from = sourceLang ?? response.data.detectedSourceLang;
    remember({ text: selection.text, result: response.data.text, to: targetLang, ...(from ? { from } : {}) });
  }

  /** Into the popup's History. Best effort: an orphaned script or full storage must not break the flow. */
  function remember(entry: DistributiveOmit<HistoryEntry, 'site' | 'at'>, selection: EditableSelection | null = null): void {
    const text = plainText(selection, entry.text);
    const result = plainText(selection, entry.result);
    void historyStore.add({ ...entry, text, result, site: location.hostname, at: Date.now() }).catch(() => {});
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
   * The field icon's click: the grammar panel for the whole field, filled by POST /fix-grammar --
   * the only place that asks it. Re-read now, not at focus: the user kept typing. From the element,
   * not from focus: pressing the icon moves focus into the widget.
   */
  function fixGrammar(): void {
    const field = wholeField(latest.current.selection?.element ?? null);
    if (!field?.text.trim()) return fail('Type something first.', 'close');
    dispatch({ type: 'select', selection: field, anchor: getFieldAnchor(field), field: true });
    clearTimeout(checkTimer.current); // the fix brings its own count
    void loadFix(field);
  }

  /**
   * The icon's click. A text the guard found mistyped opens the layout card, random keystrokes the
   * not-text notice -- instead of the grammar panel (field) or the menu (selection).
   */
  function openFromIcon(): void {
    const { screen, selection, check } = latest.current;
    const field = screen.kind === 'icon' && !!screen.field;
    const current = field ? wholeField(selection?.element ?? null) : selection;
    const verdict = current && check?.text === current.text ? check.verdict : undefined;
    if (!current || !verdict) return void (field ? fixGrammar() : openMenu());
    if (field) dispatch({ type: 'select', selection: current, anchor: getFieldAnchor(current), field: true });
    showVerdict(current.text, verdict);
  }

  /**
   * The guard's 422, from any route: the text is no language. A wrong layout gets the layout card
   * (page text can't be re-typed, so it just says so), random keystrokes the notice. Remembered on
   * the check, so the icon keeps warning until the text changes.
   */
  function showVerdict(text: string, verdict: Verdict, message = 'Typed on the wrong keyboard layout'): void {
    dispatch({ type: 'checked', check: { text, verdict } });
    if (verdict === 'gibberish') show({ kind: 'notText' });
    else if (latest.current.selection?.kind === 'page') fail(message, 'close');
    else show({ kind: 'layout' });
  }

  /** The menu's "Grammar fix" item: the grammar panel for the selection, not the whole field. */
  function openGrammar(): void {
    const { selection } = latest.current;
    if (!selection || selection.kind === 'page') return;
    void loadFix(selection);
  }

  function showCheckError(error: { message: string; code?: string }): void {
    if (error.code === 'unauthenticated') show({ kind: 'signIn' });
    else fail(error.message, 'close');
  }

  /**
   * Opens the grammar panel on `target`'s fix: the one already fetched for this text, or a skeleton
   * until POST /fix-grammar answers. Its answer also replaces the badge's count with its own.
   * `prefetch`: asked in the background once a check found errors, so the click opens it at once.
   */
  async function loadFix(target: EditableSelection, prefetch = false): Promise<void> {
    const { check } = latest.current;
    const known = check?.text === target.text ? check : null;
    if (!prefetch) {
      if (known?.verdict) return showVerdict(target.text, known.verdict);
      if (known?.fix) return show({ kind: 'grammarFixed', fix: known.fix });
      show({ kind: 'grammarFixed', fix: null });
    }
    if (pendingFix.text === target.text) return; // in flight: its answer fills the panel
    pendingFix.abort();
    // The fix counts its own errors, so a background check of the same text is wasted.
    if (pendingCheck.text === target.text) pendingCheck.abort();
    // A /check of this exact text answered, so it passed the guard: the API skips a second one.
    const guarded = known?.errors !== undefined;
    const id = pendingFix.start(target.text);
    const answer = await sendMessage({ type: 'fix-grammar', text: target.text, id, ...(guarded ? { guarded } : {}) });
    if (!pendingFix.isCurrent(id)) return; // cancelled by an edit
    pendingFix.done();
    const now = latest.current;
    const waiting = now.screen.kind === 'grammarFixed' && !now.screen.fix && now.selection?.text === target.text;
    // A failed prefetch nobody clicked keeps the check's count: a click asks again.
    if (prefetch && !waiting && !answer.ok) return;
    const done: Check = answer.ok ? { text: target.text, errors: countFixes(answer.data.html), fix: answer.data } : toCheck(target.text, answer);
    dispatch({ type: 'checked', check: done });
    if (!waiting) return; // closed or moved on
    if (answer.ok) show({ kind: 'grammarFixed', fix: answer.data });
    else if (done.verdict) showVerdict(target.text, done.verdict);
    else showCheckError(answer.error);
  }

  /**
   * The background check behind the badge (POST /check): the error count only, never the fix. One
   * per text, driven by the field's input; it spins the icon, then badges the count. Edits cancel
   * it (onInput); a failure badges the icon.
   */
  async function checkGrammar(field = wholeField(latest.current.selection?.element ?? null)): Promise<void> {
    const { check } = latest.current;
    if (!field?.text.trim()) return;
    if (pendingCheck.text === field.text || (check?.text === field.text && answered(check) && !check.error)) return; // asked already
    pendingCheck.abort();
    const id = pendingCheck.start(field.text);
    dispatch({ type: 'checked', check: { text: field.text } });
    const answer = await sendMessage({ type: 'check', text: field.text, id });
    // Cancelled, or overtaken by a newer text: answers can arrive out of order.
    if (!pendingCheck.isCurrent(id)) return;
    pendingCheck.done();
    const done = toCheck(field.text, answer);
    dispatch({ type: 'checked', check: done });
    // Errors found: fetch the fix now, so the click shows it instead of a skeleton. Costs a fix per
    // typing pause with errors, whether or not the panel is opened.
    if (done.errors && latest.current.selection) void loadFix(field, true);
    const now = latest.current;
    if (now.screen.kind === 'icon' && now.screen.field) {
      // Re-select: a paste or autocomplete changes the text with no keyup to refresh it.
      const current = wholeField(field.element);
      if (current) dispatch({ type: 'select', selection: current, anchor: getFieldAnchor(current), field: true });
    } else if (done.verdict === 'gibberish' && now.screen.kind === 'languages' && now.selection?.text === field.text) {
      showVerdict(field.text, 'gibberish'); // the menu opened before the guard answered: nothing in it may be used
    }
  }

  /** Debounced: one check per pause in typing (or per settled selection), not per keystroke. */
  function scheduleCheck(delay = 500): void {
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(() => {
      const { screen, selection } = latest.current;
      // A single-line input (search box, filter, form field) shows its icon but costs no request
      // until the icon is clicked: clicks call checkGrammar themselves. An open menu asks for itself (openMenu).
      const skip = screen.kind !== 'icon' || selection?.element instanceof HTMLInputElement;
      // A selection's own text, not its whole field.
      const target = skip ? null : screen.field ? wholeField(selection?.element ?? null) : selection?.kind !== 'page' ? selection : null;
      // 3+ words only; the click asks for less.
      if (target && hasEnoughWords(target.text)) return void checkGrammar(target);
      dropOrphanCheck();
    }, delay);
  }

  /**
   * The field changed. A check or fix for the old text is cancelled at once, not after the pause,
   * and the icon keeps spinning into the next check. An open grammar panel closes: it showed the
   * old text's fix, and a fix is only asked on click.
   */
  function onInput(): void {
    const { selection, screen } = latest.current;
    const field = wholeField(selection?.element ?? null);
    if (!field) return scheduleCheck();
    const wasChecking = pendingCheck.text !== undefined && pendingCheck.text !== field.text;
    if (wasChecking) pendingCheck.abort();
    if (pendingFix.text !== undefined && pendingFix.text !== field.text) pendingFix.abort();
    if (screen.kind === 'grammarFixed') close();
    // Emptied, or too short to check on its own: no spinner waiting on a check that won't come. A click still asks.
    if (!hasEnoughWords(field.text)) {
      clearTimeout(checkTimer.current);
      dispatch({ type: 'checked', check: null });
      return;
    }
    if (wasChecking) dispatch({ type: 'checked', check: { text: field.text } });
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
    if (!response.ok) {
      const { code, message } = response.error;
      if (isVerdict(code)) showVerdict(selection.text, code, message);
      else fail(message, 'close');
    } else apply(response.data.text);
  }

  function apply(text: string): void {
    const { selection } = latest.current;
    if (!selection || selection.kind === 'page') return;
    if (!isSelectionUnchanged(selection)) return fail('The text changed. Try again.', 'close');
    const wholeText = wholeField(selection.element)?.text;
    replaceSelection(selection, text);
    close();
    // The whole field is now the applied fix: mark it clean so the input's re-check is skipped and
    // the icon shows ✓. After close(), to overwrite the skeleton check onInput wrote. A part of the
    // field leaves the rest unchecked, so that one is asked as usual.
    if (selection.text === wholeText) dispatch({ type: 'checked', check: cleanCheck(text) });
    remember({ kind: 'grammar', text: selection.text, result: text }, selection);
  }

  /** The grammar panel's Copy: page text is never replaced, so a copied fix is what gets used. */
  function copyFix(text: string): void {
    const { selection } = latest.current;
    if (selection) remember({ kind: 'grammar', text: selection.text, result: text }, selection);
    void navigator.clipboard.writeText(plainText(selection, text)).then(close);
  }

  /** The hover pill's "Turn off in this field". */
  function disableField(): void {
    const element = latest.current.selection?.element;
    if (!element) return;
    gate.disableField(fieldKey(element), fieldLabel(element));
    close();
  }

  /** Esc, the layout card's F, the grammar panel's ↵ / N / O and the menu's digits. Captured and swallowed, or the field would get the keystroke too. */
  function onKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    if (key === 'Escape') {
      // An open panel takes the Escape, so a popup or dialog around the field stays; the next Escape is the page's.
      if (isMenuOpen(latest.current)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return close();
    }
    const { screen } = latest.current;
    if (screen.kind === 'layout' && key === 'f') {
      event.preventDefault();
      event.stopPropagation();
      return fixLayout();
    }
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
    // Menu shortcut badges: "1".."9" pick the pair's target, then the favorites.
    const code = /^[1-9]$/.test(key) && isMenuOpen(latest.current) ? menuShortcuts(latest.current)[Number(key) - 1] : undefined;
    if (code) void translate(code);
  }

  usePageEvents(host, {
    close,
    refresh,
    onInput,
    onKeyDown,
    // A field focused with text already in it is checked too, so its icon is ready before typing.
    onFocusIn: () => {
      setTimeout(refresh, 0);
      scheduleCheck();
    },
    selectedElement: () => latest.current.selection?.element,
  });
  useEffect(() => () => clearTimeout(checkTimer.current), []);

  const viewActions: ViewActions = {
    onPick: signIn,
    onBack: () => {
      const { screen } = latest.current;
      if (screen.kind === 'error' && screen.back === 'close') close();
      else void openMenu();
    },
    onReplace: apply,
    onCopyFix: copyFix,
    onClose: close,
    onRewrite: (style) => void rewrite(style),
  };

  const callbacks: WidgetCallbacks = {
    onIconClick: openFromIcon,
    onLanguagePick: (code) => void translate(code),
    onFixLayout: fixLayout,
    onFixGrammar: openGrammar,
    onOpenSettings: () => {
      close();
      void sendMessage({ type: 'open-options' });
    },
    onDisableField: disableField,
  };

  return { state, viewActions, callbacks };
}

/** Omit that keeps a union a union: `Omit<A | B, K>` would collapse it to their common keys. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
