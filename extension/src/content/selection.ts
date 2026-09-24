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
    };

// Input types that support the selectionStart/selectionEnd API.
const SELECTABLE_INPUT_TYPES = new Set(['text', 'search', 'url', 'tel']);

export function isTextControl(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return !element.readOnly && !element.disabled;
  return (
    element instanceof HTMLInputElement &&
    SELECTABLE_INPUT_TYPES.has(element.type) &&
    !element.readOnly &&
    !element.disabled
  );
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
  return host;
}

/** Follows focus into open shadow roots (web-component editors). */
function deepActiveElement(doc: Document): Element | null {
  let active = doc.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

export function getEditableSelection(doc: Document = document): EditableSelection | null {
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

/** The focused editable field's whole text, as a selection -- so replacing it rewrites the field. */
export function getFocusedField(doc: Document = document): EditableSelection | null {
  const active = deepActiveElement(doc);
  return wholeField(isTextControl(active) ? active : findContentEditableHost(active));
}

/** The field's current text, re-read from the element rather than from focus. */
export function wholeField(element: HTMLElement | null): EditableSelection | null {
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
