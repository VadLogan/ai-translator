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
 * Anchor for the selected text. Text controls don't expose the selection's rect,
 * so a mouse selection uses the pointer's line and a keyboard one uses the whole field.
 */
export function getSelectionAnchor(snapshot: EditableSelection, pointer?: { x: number; y: number }): Anchor {
  if (snapshot.kind === 'content-editable') {
    const rect = snapshot.range.getBoundingClientRect();
    return { x: pointer?.x ?? rect.right, top: rect.top, bottom: rect.bottom };
  }
  const rect = snapshot.element.getBoundingClientRect();
  if (!pointer) return { x: rect.right, top: rect.top, bottom: rect.bottom };
  // ponytail: pointer line ± half a line height; a mirror div would give the exact rect if this drifts.
  const half = lineHeight(snapshot.element) / 2;
  return { x: pointer.x, top: pointer.y - half, bottom: pointer.y + half };
}

function lineHeight(element: HTMLElement): number {
  const style = element.ownerDocument.defaultView!.getComputedStyle(element);
  return parseFloat(style.lineHeight) || (parseFloat(style.fontSize) || 16) * 1.2;
}
