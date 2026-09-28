import type { WritableSelection } from './selection';

/**
 * Replaces the selected text. Prefers execCommand('insertText') because it
 * keeps the browser undo stack and is picked up by React/Vue/editor frameworks;
 * falls back to direct DOM edits plus a synthetic input event.
 */
export function replaceSelection(selection: WritableSelection, replacement: string): void {
  if (selection.kind === 'text-control') replaceInTextControl(selection, replacement);
  else replaceInContentEditable(selection, replacement);
}

function tryInsertText(doc: Document, text: string, command: 'insertText' | 'insertHTML' = 'insertText'): boolean {
  try {
    return typeof doc.execCommand === 'function' && doc.execCommand(command, false, text);
  } catch {
    return false;
  }
}

/** True if the page's editor took the synthetic paste (it cancels the event when it does). */
function tryPaste(element: HTMLElement, text: string, html?: string): boolean {
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', text);
  if (html !== undefined) clipboardData.setData('text/html', html);
  return !element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
}

function dispatchInput(element: HTMLElement, data: string): void {
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data }));
}

function replaceInTextControl(
  { element, start, end }: Extract<WritableSelection, { kind: 'text-control' }>,
  replacement: string,
): void {
  element.focus();
  element.setSelectionRange(start, end);

  if (tryInsertText(element.ownerDocument, replacement)) return;

  element.setRangeText(replacement, start, end, 'end');
  dispatchInput(element, replacement);
}

/** The replacement with its {{n}} tokens turned back into copies of the original mention chips. */
function withAtoms(doc: Document, text: string, atoms: Element[]): HTMLElement {
  const box = doc.createElement('div');
  for (const part of text.split(/(\{\{\d+\}\})/)) {
    const atom = atoms[Number(/^\{\{(\d+)\}\}$/.exec(part)?.[1]) - 1];
    box.append(atom ? atom.cloneNode(true) : part);
  }
  return box;
}

function replaceInContentEditable(
  { element, range, atoms }: Extract<WritableSelection, { kind: 'content-editable' }>,
  replacement: string,
): void {
  const doc = element.ownerDocument;
  element.focus();
  const selection = doc.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  // Model-based editors sync their own selection on selectionchange, which the browser fires
  // later. Without this the paste lands at their old caret (appends instead of replacing the field).
  doc.dispatchEvent(new Event('selectionchange'));

  // Model-based editors (CKEditor, Lexical, ProseMirror, ... e.g. Teams, Slack) revert
  // direct DOM edits, execCommand included, but they all handle paste and cancel it.
  // With mentions, the paste carries HTML: editors rebuild their chips from it (ProseMirror's parseDOM).
  const rich = atoms?.length ? withAtoms(doc, replacement, atoms) : null;
  if (tryPaste(element, rich?.textContent ?? replacement, rich?.innerHTML)) return;
  if (rich ? tryInsertText(doc, rich.innerHTML, 'insertHTML') : tryInsertText(doc, replacement)) return;

  range.deleteContents();
  const nodes = rich ? [...rich.childNodes] : [doc.createTextNode(replacement)];
  const fragment = doc.createDocumentFragment();
  fragment.append(...nodes);
  range.insertNode(fragment);
  range.setStartAfter(nodes[nodes.length - 1]!);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
  dispatchInput(element, replacement);
}
