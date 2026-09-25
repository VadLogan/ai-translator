import { replaceSelection } from './replace';
import { deepActiveElement, findContentEditableHost, isTextControl, type WritableSelection } from './selection';

/** Sent by the toolbar popup with `tabs.sendMessage`; the worker never sees it. */
export interface InsertMessage {
  type: 'insert';
  text: string;
}

export const isInsertMessage = (value: unknown): value is InsertMessage =>
  (value as InsertMessage | null)?.type === 'insert' && typeof (value as InsertMessage).text === 'string';

/**
 * Inserts at the caret (or over the selection) of the field that had focus when the popup opened.
 * False when no writable field is focused in this document -- then another frame may hold it.
 */
export function insertIntoFocusedField(doc: Document, text: string): boolean {
  const target = caretIn(doc);
  if (!target) return false;
  replaceSelection(target, text);
  return true;
}

function caretIn(doc: Document): WritableSelection | null {
  const active = deepActiveElement(doc);
  if (isTextControl(active)) {
    const start = active.selectionStart ?? active.value.length;
    const end = active.selectionEnd ?? start;
    return { kind: 'text-control', element: active, start, end, text: active.value.slice(start, end) };
  }
  const host = findContentEditableHost(active);
  if (!host) return null;
  const selection = doc.getSelection();
  let range = selection && selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  if (!range || !host.contains(range.commonAncestorContainer)) {
    // Focused but no caret inside it: append at the end.
    range = doc.createRange();
    range.selectNodeContents(host);
    range.collapse(false);
  }
  return { kind: 'content-editable', element: host, range, text: range.toString() };
}
