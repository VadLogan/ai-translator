import type { EditableSelection } from './selection';

/**
 * Replaces the selected text. Prefers execCommand('insertText') because it
 * keeps the browser undo stack and is picked up by React/Vue/editor frameworks;
 * falls back to direct DOM edits plus a synthetic input event.
 */
export function replaceSelection(selection: EditableSelection, replacement: string): void {
  if (selection.kind === 'text-control') replaceInTextControl(selection, replacement);
  else replaceInContentEditable(selection, replacement);
}

function tryInsertText(doc: Document, text: string): boolean {
  try {
    return typeof doc.execCommand === 'function' && doc.execCommand('insertText', false, text);
  } catch {
    return false;
  }
}

/** True if the page's editor took the synthetic paste (it cancels the event when it does). */
function tryPaste(element: HTMLElement, text: string): boolean {
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', text);
  return !element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
}

function dispatchInput(element: HTMLElement, data: string): void {
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data }));
}

function replaceInTextControl(
  { element, start, end }: Extract<EditableSelection, { kind: 'text-control' }>,
  replacement: string,
): void {
  element.focus();
  element.setSelectionRange(start, end);

  if (tryInsertText(element.ownerDocument, replacement)) return;

  element.setRangeText(replacement, start, end, 'end');
  dispatchInput(element, replacement);
}

function replaceInContentEditable(
  { element, range }: Extract<EditableSelection, { kind: 'content-editable' }>,
  replacement: string,
): void {
  const doc = element.ownerDocument;
  element.focus();
  const selection = doc.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  // Model-based editors (CKEditor, Lexical, ProseMirror, ... e.g. Teams, Slack) revert
  // direct DOM edits, execCommand included, but they all handle paste and cancel it.
  if (tryPaste(element, replacement)) return;
  if (tryInsertText(doc, replacement)) return;

  range.deleteContents();
  const node = doc.createTextNode(replacement);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
  dispatchInput(element, replacement);
}
