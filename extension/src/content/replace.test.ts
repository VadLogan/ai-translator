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

  it('keeps the whitespace around the selection and trims the replacement', () => {
    document.body.innerHTML = '<textarea>Hello world !</textarea>';
    const textarea = document.querySelector('textarea')!;
    textarea.focus();
    textarea.setSelectionRange(5, 12); // " world "

    replaceSelection(getEditableSelection()!, '\nWelt\n');

    expect(textarea.value).toBe('Hello Welt !');
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

  it('puts mention chips back: HTML in the paste, cloned chips in the DOM fallback', () => {
    const chip = '<span data-mention-id="42" contenteditable="false">@Ann</span>';
    document.body.innerHTML = `<div contenteditable="true">Hi ${chip}, ok</div>`;
    const editor = document.querySelector('div')!;
    let html = '';
    let plain = '';
    editor.addEventListener('paste', (event) => {
      html = event.clipboardData!.getData('text/html');
      plain = event.clipboardData!.getData('text/plain');
    });
    const range = document.createRange();
    range.selectNodeContents(editor);
    document.getSelection()!.addRange(range);

    replaceSelection(getEditableSelection()!, 'Hallo {{1}}, gut');

    expect(html).toBe(`Hallo ${chip}, gut`);
    expect(plain).toBe('Hallo @Ann, gut');
    expect(editor.innerHTML).toBe(`Hallo ${chip}, gut`); // nobody took the paste
  });

  it('pastes links as plain text and rebuilds them as bare <a href> (Teams itemid/itemtype dropped)', () => {
    const url = 'https://x.test/pull/649';
    document.body.innerHTML = `<div contenteditable="true">hi: for this: <a href="${url}" itemtype="http://schema.skype.com/HyperLink" itemid="u1">${url}</a>; ok</div>`;
    const editor = document.querySelector('div')!;
    let html: string | undefined;
    let plain = '';
    editor.addEventListener('paste', (event) => {
      html = event.clipboardData!.getData('text/html');
      plain = event.clipboardData!.getData('text/plain');
    });
    const range = document.createRange();
    range.selectNodeContents(editor);
    document.getSelection()!.addRange(range);

    replaceSelection(getEditableSelection()!, 'Hi: for this, {{1}}, ok.');

    expect(plain).toBe(`Hi: for this, ${url}, ok.`);
    expect(html).toBe('');
    expect(editor.innerHTML).toBe(`Hi: for this, <a href="${url}">${url}</a>, ok.`);
  });
});
