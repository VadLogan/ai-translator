// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { replaceSelection } from './replace';
import { getEditableSelection } from './selection';

afterEach(() => {
  document.body.innerHTML = '';
  document.getSelection()?.removeAllRanges();
  vi.restoreAllMocks();
});

describe('replaceSelection', () => {
  it('replaces the selected part of a textarea and fires input', () => {
    document.body.innerHTML = '<textarea>Hello world!</textarea>';
    const textarea = document.querySelector('textarea')!;
    const onInput = vi.fn();
    textarea.addEventListener('input', onInput);
    textarea.focus();
    textarea.setSelectionRange(6, 11);

    replaceSelection(getEditableSelection()!, 'Welt');

    expect(textarea.value).toBe('Hello Welt!');
    expect(onInput).toHaveBeenCalledOnce();
  });

  it('uses execCommand when the browser supports it', () => {
    document.body.innerHTML = '<input value="Hello world">';
    const input = document.querySelector('input')!;
    input.focus();
    input.setSelectionRange(0, 5);
    const snapshot = getEditableSelection()!;
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    replaceSelection(snapshot, 'Hallo');

    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'Hallo');
    Reflect.deleteProperty(document, 'execCommand');
  });

  it('replaces a range inside contenteditable', () => {
    document.body.innerHTML = '<div contenteditable="true">Hello world</div>';
    const editor = document.querySelector('div')!;
    const range = document.createRange();
    range.setStart(editor.firstChild!, 6);
    range.setEnd(editor.firstChild!, 11);
    document.getSelection()!.addRange(range);

    replaceSelection(getEditableSelection()!, 'Welt');

    expect(editor.textContent).toBe('Hello Welt');
  });

  it('hands contenteditable text to an editor that handles paste', () => {
    document.body.innerHTML = '<div contenteditable="true">Hello world</div>';
    const editor = document.querySelector('div')!;
    let pasted = '';
    editor.addEventListener('paste', (event) => {
      pasted = event.clipboardData!.getData('text/plain');
      event.preventDefault(); // what model-based editors do
    });
    const range = document.createRange();
    range.setStart(editor.firstChild!, 6);
    range.setEnd(editor.firstChild!, 11);
    document.getSelection()!.addRange(range);

    replaceSelection(getEditableSelection()!, 'Welt');

    expect(pasted).toBe('Welt');
    expect(editor.textContent).toBe('Hello world'); // left to the editor, no DOM edit
  });
});
