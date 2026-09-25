export type EditableSelection =
  | {
      kind: 'text-control';
      element: HTMLInputElement | HTMLTextAreaElement;
      start: number;
      end: number;
      text: string;
    }
  | {
      kind: 'content-editable';
      element: HTMLElement;
      range: Range;
      text: string;
    }
  /** Selected page text outside any field: it can be translated, never replaced. */
  | {
      kind: 'page';
      element: HTMLElement;
      range: Range;
      text: string;
    };

/** The selections replaceSelection can write to. */
export type WritableSelection = Exclude<EditableSelection, { kind: 'page' }>;

// Input types that support the selectionStart/selectionEnd API and hold prose (url/tel don't).
const SELECTABLE_INPUT_TYPES = new Set(['text', 'search']);

// ponytail: name/autocomplete heuristic for credential and form-data fields; extend the lists when a real miss shows up.
const EXCLUDED_AUTOCOMPLETE = /^(username|email|current-password|new-password|one-time-code|tel.*|cc-.*|postal-code|url)$/;
const EXCLUDED_NAME = /(^|[\W_])(login|user(name)?|e-?mail|otp|pin|captcha|card|cvv|cvc|iban|phone|zip|postcode)([\W_]|$)/i;
const EXCLUDED_INPUT_MODES = new Set(['email', 'tel', 'numeric']);
// Page-side opt-outs: ours, and the ones pages already set for Grammarly.
const OPT_OUT = '[data-ai-translator="off"], [data-gramm="false"], [data-enable-grammarly="false"]';

/** A field the page opted out of, anywhere up its tree. */
function isOptedOut(element: Element): boolean {
  return element.closest(OPT_OUT) !== null;
}

/** Login, contact and payment inputs: never worth translating, and not worth sending to the provider. */
export function isExcludedField(element: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (isOptedOut(element)) return true;
  // A textarea is prose whatever it is called; the rest only applies to single-line inputs.
  if (!(element instanceof HTMLInputElement)) return false;
  if (element.getAttribute('spellcheck') === 'false') return true;
  const autocomplete = element.getAttribute('autocomplete')?.trim().toLowerCase().split(/\s+/) ?? [];
  if (autocomplete.some((token) => EXCLUDED_AUTOCOMPLETE.test(token))) return true;
  if (EXCLUDED_INPUT_MODES.has(element.inputMode)) return true;
  return [element.name, element.id, element.getAttribute('aria-label') ?? ''].some((value) => EXCLUDED_NAME.test(value));
}

export function isTextControl(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement {
  if (!element) return false;
  const isControl =
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLInputElement && SELECTABLE_INPUT_TYPES.has(element.type));
  return isControl && !element.readOnly && !element.disabled && !isExcludedField(element);
}

function isEditableHost(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  const attr = element.getAttribute('contenteditable');
  return element.isContentEditable || attr === '' || attr === 'true' || attr === 'plaintext-only';
}

export function findContentEditableHost(node: Node | null): HTMLElement | null {
  let element = node instanceof Element ? node : (node?.parentElement ?? null);
  let host: HTMLElement | null = null;
  // Walk to the outermost editable ancestor: that's the editor root.
  while (element) {
    if (isEditableHost(element)) host = element;
    else if (host) break;
    element = element.parentElement;
  }
  return host && !isOptedOut(host) ? host : null;
}

/** Follows focus into open shadow roots (web-component editors). */
export function deepActiveElement(doc: Document): Element | null {
  let active = doc.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

export function getEditableSelection(doc: Document = document): WritableSelection | null {
  const active = deepActiveElement(doc);

  if (isTextControl(active)) {
    const { selectionStart: start, selectionEnd: end } = active;
    if (start === null || end === null || start === end) return null;
    const text = active.value.slice(start, end);
    return text.trim() ? { kind: 'text-control', element: active, start, end, text } : null;
  }

  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const host = findContentEditableHost(range.commonAncestorContainer);
  if (!host) return null;
  const text = range.toString();
  return text.trim() ? { kind: 'content-editable', element: host, range: range.cloneRange(), text } : null;
}

/** Selected text outside any field. Fields belong to getEditableSelection, so they are left out here. */
export function getPageSelection(doc: Document = document): EditableSelection | null {
  if (isTextControl(deepActiveElement(doc))) return null;
  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container instanceof HTMLElement ? container : container.parentElement;
  if (!element || isOptedOut(element) || findContentEditableHost(container)) return null;
  const text = range.toString();
  return text.trim() ? { kind: 'page', element, range: range.cloneRange(), text } : null;
}

/** The focused editable field's whole text, as a selection -- so replacing it rewrites the field. */
export function getFocusedField(doc: Document = document): WritableSelection | null {
  const active = deepActiveElement(doc);
  return wholeField(isTextControl(active) ? active : findContentEditableHost(active));
}

/** The field's current text, re-read from the element rather than from focus. */
export function wholeField(element: HTMLElement | null): WritableSelection | null {
  if (!element) return null;
  if (isTextControl(element)) {
    return { kind: 'text-control', element, start: 0, end: element.value.length, text: element.value };
  }
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  return { kind: 'content-editable', element, range, text: range.toString() };
}

/** The field's bottom-right corner, where its icon sits. */
export function getFieldAnchor({ element }: EditableSelection): Anchor {
  const box = element.getBoundingClientRect();
  return { x: box.right, top: box.top, bottom: box.bottom };
}

/** False if the page changed the selected text since the snapshot was taken. */
export function isSelectionUnchanged(snapshot: EditableSelection): boolean {
  if (!snapshot.element.isConnected) return false;
  if (snapshot.kind === 'text-control') {
    return snapshot.element.value.slice(snapshot.start, snapshot.end) === snapshot.text;
  }
  return snapshot.range.toString() === snapshot.text;
}

/** Where the selection sits in the viewport: a horizontal position plus its top and bottom edges. */
export interface Anchor {
  x: number;
  top: number;
  bottom: number;
}

/**
 * Anchor for the selected text: the end of the selection, so the icon lands where the user
 * stopped selecting -- the same place whether they used the mouse or the keyboard.
 */
export function getSelectionAnchor(snapshot: EditableSelection): Anchor {
  if (snapshot.kind === 'text-control') return textControlAnchor(snapshot);
  const { range } = snapshot;
  const rect = lastRect(range.getClientRects()) ?? range.getBoundingClientRect();
  return { x: rect.right, top: rect.top, bottom: rect.bottom };
}

/** With several lines the selection ends at the last rect, not at the bounding one. */
function lastRect(rects: DOMRectList): DOMRect | undefined {
  return rects.length ? rects[rects.length - 1] : undefined;
}

// Everything that moves the text around inside the box, so the mirror wraps it identically.
const MIRROR_STYLES = [
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'letterSpacing', 'wordSpacing',
  'textTransform', 'textIndent', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'width', 'direction',
] as const;

/**
 * Text controls expose no rect for their selection, so lay the same text out in an off-screen
 * mirror and measure the selected span there. Falls back to the whole field when that can't be
 * measured (no layout engine, or the selection scrolled out of the field).
 */
function textControlAnchor(snapshot: Extract<EditableSelection, { kind: 'text-control' }>): Anchor {
  const { element, start } = snapshot;
  const doc = element.ownerDocument;
  const box = element.getBoundingClientRect();
  const field: Anchor = { x: box.right, top: box.top, bottom: box.bottom };
  const style = doc.defaultView?.getComputedStyle(element);
  if (!style) return field;

  const mirror = doc.createElement('div');
  for (const property of MIRROR_STYLES) mirror.style[property] = style[property];
  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.boxSizing = 'content-box';
  mirror.style.whiteSpace = element instanceof HTMLTextAreaElement ? 'pre-wrap' : 'pre';
  mirror.style.overflowWrap = 'break-word';

  const marker = doc.createElement('span');
  marker.textContent = snapshot.text;
  mirror.append(doc.createTextNode(element.value.slice(0, start)), marker);
  doc.body.append(mirror);
  const origin = mirror.getBoundingClientRect();
  const rect = lastRect(marker.getClientRects()) ?? marker.getBoundingClientRect();
  mirror.remove();
  if (!rect.height) return field;

  const top = box.top + (rect.top - origin.top) - element.scrollTop;
  const anchor: Anchor = {
    x: box.left + (rect.right - origin.left) - element.scrollLeft,
    top,
    bottom: top + rect.height,
  };
  // A selection scrolled out of the field would otherwise drag the icon off it.
  return anchor.bottom < box.top || anchor.top > box.bottom ? field : anchor;
}

// Generated id parts (uuids, hex hashes, counters) that change on every load.
const VOLATILE = /[0-9a-f]{8,}(-[0-9a-f]{4,})*|\d+/gi;

/**
 * A key for a field that survives a reload, so "Turn off in this field" sticks. Ids are often
 * generated (Teams: new-message-<uuid>), so they come last and with their volatile parts removed.
 * ponytail: two fields on one page with no distinguishing attributes share a key; add a DOM-path
 * fallback if that shows up.
 */
export function fieldKey(element: HTMLElement): string {
  const tag = element.localName;
  for (const attr of ['data-tid', 'name', 'aria-label', 'placeholder']) {
    const value = element.getAttribute(attr)?.trim();
    if (value) return `${tag}|${attr}=${value}`;
  }
  const id = element.id.replace(VOLATILE, '#');
  return id ? `${tag}|id=${id}` : tag;
}

/** What the options page shows for a turned-off field. */
export function fieldLabel(element: HTMLElement): string {
  for (const attr of ['aria-label', 'placeholder', 'name', 'id']) {
    const value = element.getAttribute(attr)?.trim();
    if (value) return value;
  }
  return element.localName;
}
