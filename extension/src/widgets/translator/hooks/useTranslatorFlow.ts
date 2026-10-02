import { useEffect, useReducer, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import type { CheckOk, FixEdit, FixGrammarOk } from '../../../../../shared/contract';
import { isProviderId } from '../../../auth/providers';
import { switchLayout } from '../../../core/layout';
import { findLanguage, type Language } from '../../../core/languages';
import { sendMessage } from '../../../messaging/messages';
import { isVoiceLevel } from '../../../messaging/recorder';
import { liveLanguage } from '../../../core/liveLanguage';
import { sentenceFixes } from '../../../core/sentenceFixes';
import { historyStore, intoLanguages, pairFor, topPairs, type HistoryEntry } from '../../../settings/history';
import { pinnedLanguages } from '../../../settings/pinned';
import { storageSettings } from '../../../settings/storage-settings';
import { replaceSelection } from '../../../content/replace';
import { caretIn, fieldKey, fieldLabel, getEditableSelection, getFieldAnchor, getFocusedField, getPageSelection, getSelectionAnchor, isSelectionUnchanged, offsetIn, partOf, plainText, wholeField, type EditableSelection, type WritableSelection } from '../../../content/selection';
import { answered, applyEdits, cleanCheck, countFixes, visibleEdits, withoutEdit, withoutFixEdit, detectedLang, hasEnoughWords, hidden, isMenuOpen, isVerdict, menuShortcuts, pairTarget, reducer, type Check, type Screen, type Verdict } from '../state';
import { toCheck, toDetection, type ViewActions, type WidgetCallbacks } from '../view';
import { carryOver, cleanFix, isBeingTyped, mergeFixes, splitChunks, splitSentences } from '../chunks';
import { chunkRequests } from './chunkRequests';
import { requestSlot } from './requestSlot';
import { usePageEvents } from './usePageEvents';
import { useSiteGate } from './useSiteGate';
import { useUnderlines } from './useUnderlines';

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
  // A multi-line field: each finished sentence gets the cheap /check while the user types, and a
  // paragraph whose checks found errors gets /fix-grammar at once (guarded: its checks passed the guard).
  const [checks] = useState(() => chunkRequests<CheckOk>((text, id) => sendMessage({ type: 'check', text, id }), cancel));
  const [fixes] = useState(() => chunkRequests<FixGrammarOk>((text, id) => sendMessage({ type: 'fix-grammar', text, id, guarded: true }), cancel));
  // The longer pause after the last input: the user is done typing, so the sentence under the caret is checked too (see scheduleCheck).
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Typing has paused (or the icon was clicked): the sentence under the caret no longer waits for its full stop. Any input clears it.
  const finished = useRef(false);
  // The last failed chunk's error, until the next round of asking.
  const fieldError = useRef<{ message: string; code?: string }>(undefined);
  // Page text's translation field: one language in flight; picking another aborts it.
  const [pendingTranslation] = useState(() => requestSlot(cancel));
  const gate = useSiteGate(() => close());
  // True while the panel writes one edit into the field: that input is ours and must not close the panel.
  const writingEdit = useRef(false);
  const underlines = useUnderlines(latest, { open: openSuggestion, close: closeSuggestion });

  const show = (screen: Screen) => dispatch({ type: 'show', screen });
  const fail = (message: string, back: 'menu' | 'close' = 'menu') => show({ kind: 'error', message, back });

  function close(): void {
    if (latest.current.screen.kind === 'recording') void sendMessage({ type: 'voice-cancel' }); // releases the mic
    if (latest.current.screen.kind === 'recording' || latest.current.dictation) dictationFix.reset(); // its sentence fixes are no use now
    stopTimers();
    checks.drop();
    fixes.drop();
    generation.current++;
    pendingTranslation.abort();
    dispatch({ type: 'close' });
    dropOrphanCheck();
  }

  /** A 'checking' placeholder with no request behind it (an edit cancelled it, then no check followed) would spin forever. */
  function dropOrphanCheck(): void {
    const { check } = latest.current;
    if (check && !answered(check) && pendingCheck.text === undefined && !checks.busy() && !fixes.busy()) dispatch({ type: 'checked', check: null });
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
    // While a dictation is open, what it produces (its translation, its inserted fix) is marked as spoken.
    const voice = latest.current.dictation ? { voice: true as const } : {};
    void historyStore.add({ ...entry, text, result, site: location.hostname, at: Date.now(), ...voice }).catch(() => {});
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
    stopTimers(); // the fix brings its own count
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
    void loadFix(selection, false, false);
  }

  function showCheckError(error: { message: string; code?: string }): void {
    if (error.code === 'unauthenticated') show({ kind: 'signIn' });
    else fail(error.message, 'close');
  }

  /**
   * Opens the grammar panel on `target`'s fix: the one already fetched for this text, or a skeleton
   * until POST /fix-grammar answers. Its answer also replaces the badge's count with its own.
   * `prefetch`: asked in the background once a check found errors, so the click opens it at once.
   * `field`: `target` is the whole field (the corner icon), not a selection in it.
   */
  async function loadFix(target: WritableSelection, prefetch = false, field = true): Promise<void> {
    const { check } = latest.current;
    const known = check?.text === target.text ? check : null;
    const panel = (fix: FixGrammarOk | null, loading?: boolean): Screen => ({ kind: 'grammar', fix, index: 0, field, base: field ? 0 : offsetIn(target), loading });
    if (field && isChunked(target)) {
      // Paragraph by paragraph: the panel opens on what is already known, or a skeleton that publish fills.
      if (known?.verdict) return showVerdict(target.text, known.verdict);
      const status = fieldStatus(target.element, target.text);
      if (status.fixedAll) return show(panel(status.fix));
      // An applied fix or a Replace's rebase: known, though the caches never saw this text.
      if (known && settled(known, status)) return show(panel(known.fix ?? cleanFix(target.text)));
      finished.current = true; // a click is as good as a pause: check the caret's sentence now too
      checkField(target);
      // After checkField: its publish runs before the render, on the icon screen. What is known so
      // far stays readable, with a spinner, instead of a skeleton.
      return show(visibleEdits(latest.current, status.fix).length ? panel(status.fix, true) : panel(null));
    }
    if (!prefetch) {
      if (known?.verdict) return showVerdict(target.text, known.verdict);
      if (known?.fix) return show(panel(known.fix));
      show(panel(null));
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
    const waiting = now.screen.kind === 'grammar' && !now.screen.fix && now.selection?.text === target.text;
    // A failed prefetch nobody clicked keeps the check's count: a click asks again.
    if (prefetch && !waiting && !answer.ok) return;
    const done: Check = answer.ok ? { text: target.text, errors: countFixes(answer.data), fix: answer.data } : toCheck(target.text, answer);
    dispatch({ type: 'checked', check: done });
    if (!waiting) return; // closed or moved on
    if (answer.ok) show(panel(answer.data));
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

  /** A multi-line field with something to ask: checked sentence by sentence, fixed paragraph by paragraph. */
  function isChunked(field: WritableSelection): boolean {
    return !(field.element instanceof HTMLInputElement) && splitChunks(field.text).length > 0;
  }

  /**
   * What the caches know of the field's text. A paragraph is fixed when /fix-grammar answered it,
   * or when all its sentences' checks found 0 errors (then it is never sent to the fix). It needs a
   * fix once every sentence is checked and one has errors. `errors` counts a fixed paragraph's
   * edits, else its checks' sum. Until its own fix answers, a paragraph is underlined with an
   * earlier version's edits that still apply (`carried`), so an edit doesn't wipe its underlines.
   * `caret`: the sentence being typed there isn't asked yet; its paragraph's ended part (`done`)
   * is fixed meanwhile, so the underlines don't wait for the user to stop typing.
   */
  function fieldStatus(element: HTMLElement, text: string, caret: number | null = null) {
    const paragraphs = splitChunks(text).map((chunk) => {
      const sentences = splitSentences(chunk);
      const typed = sentences.findIndex((s) => isBeingTyped(text, s, caret));
      const counts = sentences.map((s) => checks.get(element, s.text));
      const answer = fixes.get(element, chunk.text);
      const verdict = [answer, ...counts].find((k): k is Verdict => typeof k === 'string');
      const checked = counts.every((c) => c !== undefined);
      const errors = counts.reduce((sum, c) => sum + (typeof c === 'object' ? c.errors : 0), 0);
      const fix = typeof answer === 'object' ? answer : checked && !verdict && !errors ? cleanFix(chunk.text) : undefined;
      const carried = fix || verdict ? undefined : carriedFix(element, chunk.text);
      // Typing on at the paragraph's end: its ended sentences, as one text, are fixed meanwhile. Not
      // for an edit in the middle: the paragraph's earlier fix already carries over to the rest.
      const ended = typed > 0 && typed === sentences.length - 1 ? sentences.slice(0, typed) : [];
      const last = ended.at(-1);
      const done = last ? text.slice(chunk.start, last.start + last.text.length) : '';
      const doneErrors = counts.slice(0, typed).reduce((sum: number | undefined, c) => (sum === undefined || c === undefined ? undefined : sum + (typeof c === 'object' ? c.errors : 0)), 0);
      const fixDone = !!done && !fix && !verdict && !!doneErrors && fixes.get(element, done) === undefined;
      return {
        chunk,
        sentences: sentences.filter((_, i) => i !== typed),
        verdict,
        checked,
        errors: fix ? countFixes(fix) : errors,
        fix,
        carried,
        // What /fix-grammar is asked for: the paragraph once all of it is checked, else its ended part.
        toFix: checked && !verdict && !fix ? chunk.text : fixDone ? done : undefined,
      };
    });
    return {
      paragraphs,
      verdict: paragraphs.find((p) => p.verdict)?.verdict,
      checked: paragraphs.every((p) => p.checked),
      fixedAll: paragraphs.every((p) => p.fix),
      errors: paragraphs.reduce((sum, p) => sum + p.errors, 0),
      // Shown (badge aside): the fixed paragraphs, and the carried-over edits of the rest.
      fix: mergeFixes(text, paragraphs.flatMap((p) => { const fix = p.fix ?? p.carried; return fix ? [{ chunk: p.chunk, fix }] : []; })),
    };
  }

  /** The newest earlier version of a paragraph whose fix still says something about `text`. */
  function carriedFix(element: HTMLElement, text: string): FixGrammarOk | undefined {
    for (const [earlier, answer] of fixes.entries(element).reverse()) {
      const fix = typeof answer === 'object' ? carryOver(text, { text: earlier, fix: answer }) : null;
      if (fix) return fix;
    }
    return undefined;
  }

  /** The check is for this text but didn't come from the caches: an applied fix (clean by construction) or a Replace's rebase. */
  const settled = (check: Check, status: ReturnType<typeof fieldStatus>): boolean => answered(check) && !check.error && !status.checked;

  /**
   * The field's background round. Every sentence gets /check -- but the one under the caret waits
   * until it ends, unless typing has `finished`. publish sends each paragraph whose checks found
   * errors to /fix-grammar as soon as they answer.
   */
  function checkField(field: WritableSelection): void {
    const status = fieldStatus(field.element, field.text);
    const { check } = latest.current;
    if (check?.text === field.text && settled(check, status)) return;
    // Without the sentence being typed: it is asked once it ends, or once typing pauses.
    const sentences = fieldStatus(field.element, field.text, caretOf(field)).paragraphs.flatMap((p) => p.sentences);
    fieldError.current = undefined;
    checks.request(field.element, sentences.map((s) => s.text), (error) => onPieceAnswer(field.element, error));
    publish(field.element);
  }

  /** Where the user is typing in `field`; null once typing has finished (a pause or a click). */
  const caretOf = (field: WritableSelection): number | null => (finished.current ? null : caretIn(field));

  /** A check or fix answered: remember a failure (until the next round), then re-publish. */
  function onPieceAnswer(element: HTMLElement, error?: { message: string; code?: string }): void {
    if (error) fieldError.current = error;
    publish(element);
  }

  /**
   * Turns what the caches know into the whole-field check: a guard verdict if any piece has one,
   * else the count once every sentence is checked (spinning until then) and the merged fix of the
   * fixed paragraphs, underlined at once. Cancels requests for text edited away and asks the fixes
   * the checks call for -- not waiting for typing to pause: a paragraph is only fixed once all its
   * sentences are checked, and the one being typed isn't until it ends. Fills a grammar panel waiting on it.
   */
  function publish(element: HTMLElement): void {
    const field = wholeField(element);
    const now = latest.current;
    if (!field || now.selection?.element !== element) return; // moved on to another field
    const status = fieldStatus(element, field.text, caretOf(field));
    if (now.check?.text === field.text && settled(now.check, status)) return;
    checks.keep(element, status.paragraphs.flatMap((p) => p.sentences.map((s) => s.text)));
    const toFix = status.paragraphs.flatMap((p) => (p.toFix ? [p.toFix] : []));
    // A fix for an edited-away paragraph is let finish, not cancelled: its input is billed already,
    // its output is ~100 tokens, and its edits carry over to the new text (carriedFix) and serve an undo.
    fixes.keep(element, toFix, true);
    fixes.request(element, toFix, (error) => onPieceAnswer(element, error));
    const busy = checks.busy() || fixes.busy();
    const error = !status.fixedAll && !busy ? fieldError.current : undefined;
    const { verdict } = status;
    const check: Check = verdict ? { text: field.text, verdict } : { text: field.text, fix: status.fix, ...(status.checked ? { errors: status.errors } : {}), ...(error ? { error } : {}) };
    dispatch({ type: 'checked', check });
    const { screen } = latest.current;
    if (screen.kind === 'icon' && screen.field) {
      // Re-select: a paste or autocomplete changes the text with no keyup to refresh it. Only then:
      // a 'select' resets the screen, and this may run before a just-shown panel has rendered.
      if (now.selection.text !== field.text) dispatch({ type: 'select', selection: field, anchor: getFieldAnchor(field), field: true });
    } else if (screen.kind === 'grammar' && screen.field && (!screen.fix || screen.loading) && !screen.hover && now.selection?.text === field.text) {
      // A click's skeleton or earlier fix, waiting on the last paragraphs: each answer shows the latest.
      const left = visibleEdits(latest.current, status.fix).length;
      const index = Math.max(0, Math.min(screen.index, left - 1));
      if (verdict) showVerdict(field.text, verdict);
      else if (error) showCheckError(error);
      else if (status.fixedAll) show({ ...screen, fix: status.fix, index, loading: false });
      else if (left) show({ ...screen, fix: status.fix, index, loading: true });
    }
  }

  /** Clears both background timers; a cleared throttle must read as "nothing scheduled". */
  function stopTimers(): void {
    clearTimeout(checkTimer.current);
    clearTimeout(holdTimer.current);
    checkTimer.current = undefined;
    holdTimer.current = undefined;
  }

  /**
   * The background round. In a multi-line field it is **throttled**: a round every `delay` while the
   * user types, not one after they stop -- a round only asks sentences that just ended (the rest are
   * cached), so each sentence is checked, and its paragraph fixed, as soon as its full stop is typed.
   * The pause (`delay` + 1 s with no input) still has its own debounced round: the sentence under
   * the caret is checked too, ended or not. A selection is debounced: it is checked once it settles.
   */
  function scheduleCheck(delay = 300): void {
    const { screen, selection } = latest.current;
    clearTimeout(holdTimer.current);
    if (screen.kind === 'icon' && screen.field && !(selection?.element instanceof HTMLInputElement)) {
      checkTimer.current ??= setTimeout(round, delay);
      holdTimer.current = setTimeout(pause, delay + 1000);
      return;
    }
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(round, delay);
  }

  function round(): void {
    checkTimer.current = undefined;
    const { screen, selection } = latest.current;
    // A single-line input (search box, filter, form field) shows its icon but costs no request
    // until the icon is clicked: clicks call checkGrammar themselves. An open menu asks for itself (openMenu).
    const skip = screen.kind !== 'icon' || selection?.element instanceof HTMLInputElement;
    // A selection's own text, not its whole field.
    const target = skip ? null : screen.field ? wholeField(selection?.element ?? null) : selection?.kind !== 'page' ? selection : null;
    if (target && screen.kind === 'icon' && screen.field && isChunked(target)) return checkField(target); // ended sentences only
    // 3+ words only; the click asks for less.
    if (target && hasEnoughWords(target.text)) return void checkGrammar(target);
    dropOrphanCheck();
  }

  /** Typing paused: the user counts as done, so the sentence under the caret is checked too. */
  function pause(): void {
    holdTimer.current = undefined;
    const { screen, selection } = latest.current;
    const field = screen.kind === 'icon' && screen.field ? wholeField(selection?.element ?? null) : null;
    if (!field || !isChunked(field)) return;
    finished.current = true;
    checkField(field);
  }

  /**
   * The field changed. A check or fix for the old text is cancelled at once, not after the pause,
   * and the icon keeps spinning into the next check. An open grammar panel closes: it showed the
   * old text's fix, and a fix is only asked on click -- unless the panel is writing one of its own edits.
   */
  function onInput(): void {
    if (writingEdit.current) return;
    const { selection, screen } = latest.current;
    const field = wholeField(selection?.element ?? null);
    if (!field) return scheduleCheck();
    const wasChecking = pendingCheck.text !== undefined && pendingCheck.text !== field.text;
    if (wasChecking) pendingCheck.abort();
    if (pendingFix.text !== undefined && pendingFix.text !== field.text) pendingFix.abort();
    // An editor that applies the panel's paste later (not inside replaceSelection) fires its input after the rebase: the text already matches.
    if (screen.kind === 'grammar' && !(screen.field && field.text === latest.current.check?.text)) close();
    // Emptied, or too short to check on its own: no spinner waiting on a check that won't come. A click still asks.
    if (!hasEnoughWords(field.text)) {
      stopTimers();
      checks.drop();
      fixes.drop();
      dispatch({ type: 'checked', check: null });
      return;
    }
    // Typing again: nothing is fixed until the next pause. The paragraphs the edit didn't touch keep
    // their count and underlines at once; the touched one spins until checked.
    finished.current = false;
    if (isChunked(field)) publish(field.element);
    else if (wasChecking) dispatch({ type: 'checked', check: { text: field.text } });
    scheduleCheck();
  }

  /**
   * The field's DOM changed with no input event: the page wrote it (a chat clearing its composer on
   * send). Re-read it, so the badge never describes text that is gone, then treat it as an edit.
   */
  function onMutation(): void {
    const { screen, selection } = latest.current;
    if (writingEdit.current || screen.kind !== 'icon' || !screen.field || !selection) return;
    const field = wholeField(selection.element);
    if (!field || field.text === selection.text) return;
    dispatch({ type: 'select', selection: field, anchor: getFieldAnchor(field), field: true });
    onInput();
  }

  function apply(text: string, selection = latest.current.selection): void {
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

  /**
   * Hovering an underline: the grammar panel on that edit, under the underline's first line. Only
   * over the field's own icon screen or another hover-opened panel (not over a menu or a clicked panel).
   */
  function openSuggestion(edit: FixEdit, line: DOMRect): void {
    const state = latest.current;
    const { screen, check } = state;
    const hovering = screen.kind === 'grammar' && screen.hover;
    if (!check?.fix || !((screen.kind === 'icon' && screen.field) || hovering)) return;
    const index = visibleEdits(state).findIndex((e) => e.start === edit.start && e.end === edit.end);
    if (index < 0) return;
    dispatch({ type: 'moved', anchor: { x: line.left - 6, top: line.top, bottom: line.bottom } });
    show({ kind: 'grammar', fix: check.fix, index, field: true, base: 0, hover: true });
  }

  function closeSuggestion(): void {
    const { screen } = latest.current;
    if (screen.kind === 'grammar' && screen.hover) show({ kind: 'icon', field: true });
  }

  /**
   * The panel's Replace: only the shown edit's words in the field. The panel's fix (and, for the
   * whole field, the check) is rebased onto the new text (withoutFixEdit), so the other edits and
   * underlines stay put, the replacement's input asks nothing, and the next edit slides into view.
   * Closes after the last one.
   */
  function replaceEdit(edit: FixEdit): void {
    const { screen, selection, check, dictation: said } = latest.current;
    if (screen.kind === 'grammar' && screen.dictated && screen.fix && said) {
      // A dictation's edit changes the panel's copy; the field waits for Insert.
      const fix = withoutFixEdit(screen.fix, edit);
      dispatch({ type: 'dictated', dictation: { ...said, text: applyEdits(said.text, [edit]) } });
      const left = visibleEdits(latest.current, fix).length;
      return show({ ...screen, fix, index: Math.max(0, Math.min(screen.index, left - 1)) });
    }
    if (screen.kind !== 'grammar' || !screen.fix || !selection || selection.kind === 'page') return;
    const field = wholeField(selection.element);
    const part = field && partOf(field, screen.base + edit.start, screen.base + edit.end);
    if (!part || part.text !== edit.original) return fail('The text changed. Try again.', 'close');
    writingEdit.current = true;
    try {
      replaceSelection(part, edit.replacement);
    } finally {
      writingEdit.current = false;
    }
    remember({ kind: 'grammar', text: edit.original, result: edit.replacement }, selection);
    const fix = withoutFixEdit(screen.fix, edit);
    const nextCheck = screen.field && check?.fix ? withoutEdit(check, edit) : check;
    const length = selection.text.length + edit.replacement.length - (edit.end - edit.start);
    const after = wholeField(selection.element);
    const nextSelection = after && partOf(after, screen.base, screen.base + length);
    const left = visibleEdits({ ...latest.current, check: nextCheck }, fix).length;
    if (!nextSelection || !left) {
      close();
      dispatch({ type: 'checked', check: nextCheck });
      return void setTimeout(refresh, 0); // the corner icon and the other underlines back, after the close renders
    }
    selection.element.focus({ preventScroll: true });
    dispatch({ type: 'edited', selection: nextSelection, screen: { ...screen, fix, index: Math.min(screen.index, left - 1) }, check: nextCheck });
    underlines.relayout();
  }

  /**
   * The panel's Ignore. Focus goes back to the field first: pressing the button focused it, and when
   * the panel unmounts focus would fall to <body>, whose focusout refresh closes the widget.
   */
  function ignoreEdit(edit: FixEdit): void {
    latest.current.selection?.element.focus({ preventScroll: true });
    dispatch({ type: 'ignore', edit });
  }

  /** The panel's Replace all: every edit still showing, through the whole-target Replace. */
  function replaceAll(): void {
    const state = latest.current;
    const { screen, selection } = state;
    // A dictation's Replace all takes every edit and inserts the result: nothing is left to review.
    if (screen.kind === 'grammar' && screen.dictated && screen.fix && state.dictation) return insertDictation(applyEdits(state.dictation.text, visibleEdits(state, screen.fix)));
    if (screen.kind !== 'grammar' || !screen.fix || !selection || selection.kind === 'page') return;
    if (!screen.field) return apply(applyEdits(selection.text, visibleEdits(state, screen.fix)));
    const field = wholeField(selection.element);
    if (!field || field.text !== state.check?.text) return fail('The text changed. Try again.', 'close');
    apply(applyEdits(field.text, visibleEdits(state, screen.fix)), field);
  }

  /** The panel's ‹ › and a click on a highlight. */
  function step(index: number): void {
    const { screen } = latest.current;
    if (screen.kind === 'grammar') show({ ...screen, index });
  }

  /** The selected field moved. Its icon, underlines and grammar panel follow it (a hover-opened one falls back to the icon); anything else closes. */
  function onScroll(): void {
    const { screen, selection } = latest.current;
    if (!selection || !((screen.kind === 'icon' && screen.field) || (screen.kind === 'grammar' && screen.field))) return close();
    if (screen.kind === 'grammar' && screen.hover) show({ kind: 'icon', field: true }); // it sat under an underline that just moved
    dispatch({ type: 'moved', anchor: getFieldAnchor(selection) });
    underlines.relayout();
  }

  // The live text's language, asked while the user speaks so Stop can skip "Transcribing…".
  const [liveLang] = useState(() => liveLanguage(async (text) => {
    const answer = await sendMessage({ type: 'detect', text });
    return answer.ok ? answer.data.lang : undefined;
  }));
  // An English dictation's grammar fix, made sentence by sentence while it is spoken.
  const [dictationFix] = useState(() => sentenceFixes((text, id) => sendMessage({ type: 'fix-grammar', text, id }), cancel));
  // Where the dictation goes: the field's caret offset when the mic was pressed.
  const dictation = useRef<{ element: HTMLElement; at: number }>(undefined);

  /** The hover pill's mic: records (in the worker's offscreen recorder) until Stop. */
  async function dictate(): Promise<void> {
    const field = wholeField(latest.current.selection?.element ?? null);
    if (!field) return;
    // Read before the press moves focus into the widget: a textarea keeps its selectionEnd, a contenteditable the document selection.
    const caret = field.kind === 'text-control' ? (field.element as HTMLInputElement | HTMLTextAreaElement).selectionEnd : caretIn(field);
    dictation.current = { element: field.element, at: caret ?? field.text.length };
    liveLang.reset();
    dictationFix.reset();
    stopTimers();
    dispatch({ type: 'select', selection: field, anchor: getFieldAnchor(field), field: true });
    show({ kind: 'recording' });
    // The pressed mic unmounts with the pill: focus back to the field, or it falls to <body> and
    // editors that react to blur (Teams) rebuild the composer under us.
    field.element.focus({ preventScroll: true });
    const id = generation.current;
    const response = await sendMessage({ type: 'voice-start' });
    if (id !== generation.current) return void sendMessage({ type: 'voice-cancel' }); // closed while the mic was starting
    if (!response.ok) fail(response.error.message, 'close');
  }

  /**
   * Stop: the recording is transcribed and stays in the widget -- the field is untouched until
   * Insert. English gets the grammar panel on what was said; a language the user has a pair for is
   * translated into its target at once; any other gets the menu's languages to pick from. The
   * selection becomes a page-kind stand-in holding the transcript, so the page-text menu and its
   * translation field work on it unchanged.
   *
   * When the live text's language is known already (`liveLang`, asked while the user spoke), that
   * panel opens at once on the live text, in its loading state, and the final transcript (~0.8 s
   * later) fills it in: only then is the fix or translation asked, so nothing is asked twice.
   * Otherwise "Transcribing…" shows until the transcript and its language are back.
   */
  async function stopDictation(): Promise<void> {
    const { screen } = latest.current;
    if (screen.kind !== 'recording' || screen.transcribing) return;
    const id = generation.current;
    dictation.current?.element.focus({ preventScroll: true }); // Stop unmounts: keep focus in the field, not on <body>
    const early = screen.text && liveLang.lang ? { text: screen.text, lang: liveLang.lang } : null;
    let target: string | undefined;
    if (early) {
      const opened = await openDictation(early.text, early.lang);
      if (opened === null || id !== generation.current) return;
      target = opened;
    } else {
      show({ kind: 'recording', transcribing: true });
    }
    const response = await sendMessage({ type: 'voice-stop', ...(early ? { lang: early.lang } : {}) });
    if (id !== generation.current) return;
    if (!response.ok) return response.error.code === 'unauthenticated' ? show({ kind: 'signIn' }) : fail(response.error.message, 'close');
    const { text } = response.data;
    if (!text) return fail("Didn't catch that. Try again.", 'close');
    const lang = early?.lang ?? response.data.lang;
    if (early) {
      // The final transcript replaces the live text the panel opened on.
      const { selection, screen: now, check, dictation: said } = latest.current;
      if (selection?.kind !== 'page' || !said) return;
      dispatch({ type: 'edited', selection: { ...selection, text }, screen: now, check });
      dispatch({ type: 'dictated', dictation: { ...said, transcript: text, text } });
      await new Promise((resolve) => setTimeout(resolve, 0)); // latest.current catches up with the final text
      if (id !== generation.current) return;
    } else {
      const opened = await openDictation(text, lang);
      if (opened === null || id !== generation.current) return;
      target = opened;
    }
    if (lang === 'en') return void fixDictation(text);
    // The pair's target, or a language picked from the menu meanwhile (its translation was of the live text).
    const into = target ?? latest.current.translation?.lang;
    if (into) void translateInField(into, lang);
  }

  /**
   * Opens the dictation's panel on `text`: the page-kind stand-in selection, the detected language,
   * then the grammar panel's skeleton (English) or the menu, with the pair's target as the
   * translation field's skeleton. Asks nothing. Returns that target (undefined: none), or null when
   * the field is gone.
   */
  async function openDictation(text: string, lang: string): Promise<string | undefined | null> {
    const field = wholeField(dictation.current?.element ?? null);
    if (!field) {
      fail(`The field is gone. You said: “${text}”`, 'close');
      return null;
    }
    const range = field.element.ownerDocument.createRange();
    range.selectNodeContents(field.element);
    range.collapse(false);
    dispatch({ type: 'select', selection: { kind: 'page', element: field.element, range, text }, anchor: getFieldAnchor(field) });
    dispatch({ type: 'dictated', dictation: { transcript: text, text, at: Math.min(dictation.current?.at ?? field.text.length, field.text.length) } });
    dispatch({ type: 'detected', detection: lang === 'und' ? 'unknown' : { lang } });
    if (lang === 'en') {
      show({ kind: 'grammar', fix: null, index: 0, base: 0, field: false, dictated: true });
      return undefined;
    }
    // The menu at once: left on the icon screen across the awaits below, the focus refresh that
    // Stop's refocus queued would re-select the field and drop this stand-in.
    show({ kind: 'languages' });
    const history = await historyStore.get().catch(() => []);
    await openMenu();
    const target = pairFor(topPairs(history, Infinity), lang);
    if (target) dispatch({ type: 'translation', translation: { lang: target } }); // a skeleton until the final text is translated
    return target;
  }

  /**
   * The grammar panel on the dictated text: a skeleton, then the fix. Its Replace / Ignore edit the
   * panel's copy only. The sentences fixed while the user spoke are reused (`dictationFix`), so
   * usually only the last one is still asked. While some are still pending, the panel shows the
   * sentences fixed so far (`loading`), and each answer fills in more.
   */
  async function fixDictation(text: string): Promise<void> {
    show({ kind: 'grammar', fix: null, index: 0, base: 0, field: false, dictated: true });
    const id = generation.current;
    // A fix of `text` onto the panel, whose copy a Replace on an earlier part may have edited meanwhile.
    const update = (fix: FixGrammarOk, loading: boolean): void => {
      const { screen, dictation: said } = latest.current;
      if (id !== generation.current || screen.kind !== 'grammar' || !screen.dictated || !said) return; // closed
      const rebased = said.text === text ? fix : carryOver(said.text, { text, fix });
      if (!rebased) return loading ? undefined : show({ ...screen, loading: false });
      const left = visibleEdits(latest.current, rebased).length;
      if (loading && !left) return; // nothing to show yet: the skeleton stays
      show({ ...screen, fix: rebased, index: Math.max(0, Math.min(screen.index, left - 1)), loading });
    };
    const answer = await dictationFix.finish(text, (fix) => update(fix, true));
    if (id !== generation.current) return;
    const { screen } = latest.current;
    if (screen.kind !== 'grammar' || !screen.dictated) return; // closed
    if (answer.ok) return update(answer.data, false);
    if (answer.error.code === 'unauthenticated') return show({ kind: 'signIn' });
    fail(`${answer.error.message} You said: “${text}”`, 'close');
  }

  /**
   * The dictation panel's Insert: `result` (the fixed text or the translation) at the field's caret
   * as it was when the mic was pressed. replaceSelection trims what it writes, so a needed space
   * goes in with the word before it.
   */
  function insertDictation(result: string): void {
    const { dictation: said, selection } = latest.current;
    if (!said || !selection) return;
    const field = selection.element.isConnected ? wholeField(selection.element) : null;
    if (!field) return fail(`The field is gone. The text was: “${result}”`, 'close');
    const at = Math.min(said.at, field.text.length);
    // ponytail: never across a `}` -- it may close a mention token, whose offsets don't map one to one.
    const glue = at > 0 && !/[\s\u00a0}]/.test(field.text[at - 1]!);
    const target = partOf(field, glue ? at - 1 : at, at);
    if (!target) return fail(`Couldn't write into the field. The text was: “${result}”`, 'close');
    replaceSelection(target, glue ? `${target.text} ${result}` : result);
    // A translation was remembered when it answered; a fixed dictation is remembered here.
    if (latest.current.screen.kind === 'grammar' && result !== said.transcript) remember({ kind: 'grammar', text: said.transcript, result });
    close();
    setTimeout(() => {
      refresh(); // the field's corner icon back, after the close renders
      scheduleCheck();
    }, 0);
  }

  /** The hover pill's "Turn off in this field". */
  function disableField(): void {
    const element = latest.current.selection?.element;
    if (!element) return;
    gate.disableField(fieldKey(element), fieldLabel(element));
    close();
  }

  /** Esc, the layout card's F, the grammar panel's ↵ and the menu's digits. Captured and swallowed, or the field would get the keystroke too. */
  function onKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    if (key === 'Enter' && latest.current.screen.kind === 'recording') {
      event.preventDefault();
      event.stopPropagation();
      return void stopDictation();
    }
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
    // A skeleton or clean panel has nothing to apply, so Enter stays the field's (in Teams, Enter
    // sends); a hover-opened panel takes it only while the pointer is on it.
    const edit = screen.kind === 'grammar' && screen.fix ? visibleEdits(latest.current, screen.fix)[screen.index] : undefined;
    if (edit && key === 'Enter' && !(screen.kind === 'grammar' && screen.hover && !underlines.isOnCard())) {
      event.preventDefault();
      event.stopPropagation();
      return replaceEdit(edit);
    }
    // Menu shortcut badges: "1".."9" pick the pair's target, then the favorites.
    const code = /^[1-9]$/.test(key) && isMenuOpen(latest.current) ? menuShortcuts(latest.current)[Number(key) - 1] : undefined;
    if (code) void translate(code);
  }

  usePageEvents(host, {
    close,
    refresh,
    onInput,
    onMutation,
    onKeyDown,
    onScroll,
    onPointer: underlines.onPointer,
    // A field focused with text already in it is checked too, so its icon is ready before typing.
    onFocusIn: () => {
      setTimeout(refresh, 0);
      scheduleCheck();
    },
    selectedElement: () => latest.current.selection?.element,
  });
  useEffect(() => stopTimers, []);
  // The recorder's level meter and live text, forwarded by the worker to this frame while it dictates; its `silent` stops it.
  useEffect(() => {
    const onLevel = (message: unknown) => {
      const { screen } = latest.current;
      if (!isVoiceLevel(message) || screen.kind !== 'recording' || screen.transcribing) return;
      if (message.silent) return void stopDictation(); // 3 s of silence: as if Stop was pressed
      liveLang.feed(message.text);
      if (liveLang.lang === 'en') dictationFix.feed(message.text); // its grammar panel is coming: fix the ended sentences now
      show({ kind: 'recording', level: message.level, ms: message.ms, text: message.text });
    };
    browser.runtime.onMessage.addListener(onLevel);
    return () => browser.runtime.onMessage.removeListener(onLevel);
  }, []);

  const viewActions: ViewActions = {
    onPick: signIn,
    onBack: () => {
      const { screen } = latest.current;
      if (screen.kind === 'error' && screen.back === 'close') close();
      else void openMenu();
    },
    onClose: close,
    onReplaceEdit: replaceEdit,
    onIgnoreEdit: ignoreEdit,
    onReplaceAll: replaceAll,
    onStep: step,
    onStopDictation: () => void stopDictation(),
    onInsertDictation: insertDictation,
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
    onDictate: () => void dictate(),
  };

  return { state, viewActions, callbacks, marks: underlines.marks };
}

/** Omit that keeps a union a union: `Omit<A | B, K>` would collapse it to their common keys. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
