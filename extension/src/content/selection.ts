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
      /** Mentions and links show up here as {{1}}, {{2}}, …: the n-th token stands for atoms[n - 1]. */
      text: string;
      atoms?: Element[];
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
// The page-side opt-out. Grammarly's (data-gramm="false") is deliberately not honored: chat apps
// (ChatGPT, claude.ai) set it on their composer because Grammarly's overlay fights the editor.
const OPT_OUT = '[data-ai-translator="off"]';

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
  const snapshot = serialize(range.cloneRange(), host);
  return snapshot.text.trim() ? { kind: 'content-editable', element: host, ...snapshot } : null;
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
  return { kind: 'content-editable', element, ...serialize(range, element) };
}

// ponytail: mention chips by markup (Jira/ProseMirror data-mention-id, Teams itemtype, CKEditor .mention),
// plus any non-editable island, plus links, plus quoted earlier messages (Teams replies carry itemtype
// .../Reply; any blockquote) -- all kept verbatim so a fix touches only the user's own prose;
// extend when a real editor's chip slips through.
const MENTION =
  '[data-mention-id], [data-mention], [itemtype*="Mention"], .mention, [contenteditable="false"], a[href], blockquote, [itemtype*="Reply"]';

/** The outermost mention around a node, inside the host. */
function mentionAround(node: Node, host: HTMLElement): Element | null {
  let mention: Element | null = null;
  for (let el = node instanceof Element ? node : node.parentElement; el && el !== host && host.contains(el); el = el.parentElement) {
    if (el.matches(MENTION)) mention = el;
  }
  return mention;
}

/**
 * The range's text with each mention swapped for a {{n}} token, so it survives the provider and
 * replaceSelection can put the original chip back. Widens `range` (mutated) over a chip it cuts.
 */
function serialize(range: Range, host: HTMLElement): { range: Range; text: string; atoms?: Element[] } {
  const start = mentionAround(range.startContainer, host);
  const end = mentionAround(range.endContainer, host);
  if (start) range.setStartBefore(start);
  if (end) range.setEndAfter(end);
  const fragment = range.cloneContents();
  const atoms = [...fragment.querySelectorAll(MENTION)].filter((el) => !el.parentElement?.closest(MENTION));
  if (!atoms.length) return { range, text: range.toString() };
  atoms.forEach((atom, i) => atom.replaceWith(`{{${i + 1}}}`));
  return { range, text: fragment.textContent ?? '', atoms };
}

/** Tokens back to the chips' own text: for what the user reads (panels, history), never for writing. */
export function plainText(selection: EditableSelection | null, text: string): string {
  const atoms = selection?.kind === 'content-editable' ? selection.atoms : undefined;
  return atoms ? text.replace(/\{\{(\d+)\}\}/g, (token, n) => atoms[Number(n) - 1]?.textContent ?? token) : text;
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
  if (snapshot.kind === 'page') return snapshot.range.toString() === snapshot.text;
  return serialize(snapshot.range.cloneRange(), snapshot.element).text === snapshot.text;
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

/** Text controls expose no rect for their selection, so it is measured in a mirror; the whole field when that fails. */
function textControlAnchor(snapshot: Extract<EditableSelection, { kind: 'text-control' }>): Anchor {
  const box = snapshot.element.getBoundingClientRect();
  const rect = textControlRects(snapshot.element, [snapshot])[0]?.at(-1);
  return rect ? { x: rect.right, top: rect.top, bottom: rect.bottom } : { x: box.right, top: box.top, bottom: box.bottom };
}

/**
 * Viewport rects (one per line) of each `[start, end)` range of a text control's value, ranges in
 * order and apart. Lays the same text out in one off-screen mirror, one span per range, so a
 * field's worth of underlines costs a single layout. Rects scrolled out of the field, and anything
 * that can't be measured (no layout engine), come back empty.
 */
export function textControlRects(element: HTMLInputElement | HTMLTextAreaElement, ranges: readonly { start: number; end: number }[]): DOMRect[][] {
  const doc = element.ownerDocument;
  const style = doc.defaultView?.getComputedStyle(element);
  if (!style) return ranges.map(() => []);

  const mirror = doc.createElement('div');
  for (const property of MIRROR_STYLES) mirror.style[property] = style[property];
  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.boxSizing = 'content-box';
  mirror.style.whiteSpace = element instanceof HTMLTextAreaElement ? 'pre-wrap' : 'pre';
  mirror.style.overflowWrap = 'break-word';

  const { value } = element;
  let at = 0;
  const markers = ranges.map(({ start, end }) => {
    const marker = doc.createElement('span');
    marker.textContent = value.slice(start, end);
    mirror.append(doc.createTextNode(value.slice(at, start)), marker);
    at = end;
    return marker;
  });
  // The rest too: the words after a range decide where its line wraps.
  mirror.append(doc.createTextNode(value.slice(at)));
  doc.body.append(mirror);
  const origin = mirror.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const rects = markers.map((marker) =>
    [...marker.getClientRects()].map(
      (r) => new DOMRect(box.left + (r.left - origin.left) - element.scrollLeft, box.top + (r.top - origin.top) - element.scrollTop, r.width, r.height),
    ),
  );
  mirror.remove();
  return rects.map((lines) => inside(lines, box));
}

/** Rects on screen within the field: a line scrolled out of it would otherwise drag marks off it. */
function inside(rects: DOMRect[], box: DOMRect): DOMRect[] {
  return rects.filter((r) => r.height > 0 && r.bottom >= box.top && r.top <= box.bottom);
}

/** Viewport rects of a contenteditable range, one per line, clipped to the field like textControlRects. */
export function rangeRects(range: Range, host: HTMLElement): DOMRect[] {
  return inside([...range.getClientRects()], host.getBoundingClientRect());
}

/**
 * The DOM range of `[start, end)` in a contenteditable's serialized text (wholeField's `text`):
 * text nodes count their length, each mention counts as its {{n}} token and is never entered --
 * the same walk serialize makes. Null when the offsets run past the text.
 */
export function rangeAt(host: HTMLElement, start: number, end: number): Range | null {
  const range = host.ownerDocument.createRange();
  let pos = 0;
  let atoms = 0;
  let started = false;
  // Places the range's ends that fall in this piece of text, [pos, next). True once the end is placed.
  const place = (next: number, setStart: () => void, setEnd: () => void): boolean => {
    if (!started && start < next) {
      setStart();
      started = true;
    }
    if (started && end <= next) {
      setEnd();
      return true;
    }
    pos = next;
    return false;
  };
  const walk = (node: Node): boolean => {
    for (const child of node.childNodes) {
      if (child instanceof Element && child.matches(MENTION)) {
        // A cut token takes in the whole chip, as serialize widens a range over one.
        if (place(pos + `{{${++atoms}}}`.length, () => range.setStartBefore(child), () => range.setEndAfter(child))) return true;
      } else if (child.nodeType === Node.TEXT_NODE) {
        const from = pos;
        if (place(pos + (child as Text).length, () => range.setStart(child, start - from), () => range.setEnd(child, end - from))) return true;
      } else if (walk(child)) return true;
    }
    return false;
  };
  return walk(host) ? range : null;
}

/** The part `[start, end)` of a whole-field snapshot, as a selection replaceSelection can write. */
export function partOf(field: WritableSelection, start: number, end: number): WritableSelection | null {
  const text = field.text.slice(start, end);
  if (field.kind === 'text-control') return { ...field, start, end, text };
  const range = rangeAt(field.element, start, end);
  return range && { ...field, range, text };
}

/**
 * Where `selection`'s text starts in its whole field's text (`wholeField`), so an edit of the
 * selection's fix can be found in the field. ponytail: a mention before the selection counts as its
 * whole-field token, so its digits can shift this by one past {{9}}; an edit that then misses is
 * refused by the caller's text check.
 */
export function offsetIn(selection: WritableSelection): number {
  if (selection.kind === 'text-control') return selection.start;
  const before = selection.element.ownerDocument.createRange();
  before.selectNodeContents(selection.element);
  before.setEnd(selection.range.startContainer, selection.range.startOffset);
  return serialize(before, selection.element).text.length;
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
