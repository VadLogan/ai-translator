// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { fieldKey, getEditableSelection, getFocusedField, getPageSelection, getSelectionAnchor, isSelectionUnchanged, isTextControl } from './selection';

afterEach(() => {
  document.body.innerHTML = '';
  document.getSelection()?.removeAllRanges();
});

describe('getEditableSelection', () => {
  it('reads the selection of a focused textarea', () => {
    document.body.innerHTML = '<textarea>Hello world</textarea>';
    const textarea = document.querySelector('textarea')!;
    textarea.focus();
    textarea.setSelectionRange(6, 11);

    expect(getEditableSelection()).toMatchObject({ kind: 'text-control', start: 6, end: 11, text: 'world' });
  });

  it('ignores collapsed, blank, and non-text inputs', () => {
    document.body.innerHTML = '<input value="a   b"><input type="password" value="secret">';
    const [text, password] = document.querySelectorAll('input');

    text!.focus();
    text!.setSelectionRange(2, 2);
    expect(getEditableSelection()).toBeNull();
    text!.setSelectionRange(1, 4);
    expect(getEditableSelection()).toBeNull();

    password!.focus();
    password!.setSelectionRange(0, 6);
    expect(getEditableSelection()).toBeNull();
  });

  it('reads a selection inside contenteditable and ignores plain page text', () => {
    document.body.innerHTML = '<p id="plain">Page text</p><div contenteditable="true"><p id="p">Hello world</p></div>';
    const range = document.createRange();
    const selection = document.getSelection()!;

    range.setStart(document.querySelector('#plain')!.firstChild!, 0);
    range.setEnd(document.querySelector('#plain')!.firstChild!, 4);
    selection.addRange(range);
    expect(getEditableSelection()).toBeNull();

    selection.removeAllRanges();
    const node = document.querySelector('#p')!.firstChild!;
    const editorRange = document.createRange();
    editorRange.setStart(node, 0);
    editorRange.setEnd(node, 5);
    selection.addRange(editorRange);

    const result = getEditableSelection();
    expect(result).toMatchObject({ kind: 'content-editable', text: 'Hello' });
    expect(result?.element).toBe(document.querySelector('[contenteditable]'));
  });
});

describe('getPageSelection', () => {
  const select = (node: Node, start: number, end: number) => {
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
  };

  it('reads plain page text and leaves fields to getEditableSelection', () => {
    document.body.innerHTML = '<p id="plain">Page text</p><div contenteditable="true"><p id="p">Hello world</p></div><textarea>x</textarea>';
    const plain = document.querySelector('#plain')!;

    select(plain.firstChild!, 5, 9);
    expect(getPageSelection()).toMatchObject({ kind: 'page', text: 'text', element: plain });

    select(plain.firstChild!, 4, 4);
    expect(getPageSelection()).toBeNull();

    select(document.querySelector('#p')!.firstChild!, 0, 5);
    expect(getPageSelection()).toBeNull();

    select(plain.firstChild!, 5, 9);
    document.querySelector('textarea')!.focus();
    expect(getPageSelection()).toBeNull();
  });
});

describe('field exclusions', () => {
  const field = (html: string) => {
    document.body.innerHTML = html;
    return document.querySelector('input, textarea');
  };

  it.each([
    '<input type="email">',
    '<input type="tel">',
    '<input type="url">',
    '<input autocomplete="username">',
    '<input autocomplete="section-login one-time-code">',
    '<input autocomplete="cc-number">',
    '<input name="login">',
    '<input id="user_name">',
    '<input name="userEmail" aria-label="E-mail">',
    '<input inputmode="numeric">',
    '<input spellcheck="false">',
    '<form data-ai-translator="off"><textarea></textarea></form>',
    '<textarea data-gramm="false"></textarea>',
  ])('skips %s', (html) => {
    expect(isTextControl(field(html))).toBe(false);
  });

  it.each([
    '<input>',
    '<input type="search" name="q">',
    '<input name="message" autocomplete="off">',
    '<input name="userMessage">',
    '<textarea name="user_comment"></textarea>',
  ])('keeps %s', (html) => {
    expect(isTextControl(field(html))).toBe(true);
  });

  it('skips opted-out contenteditable editors, as a field and as page text', () => {
    document.body.innerHTML = '<div data-ai-translator="off"><div contenteditable="true">Hello world</div></div>';
    const editor = document.querySelector<HTMLElement>('[contenteditable]')!;
    editor.focus();
    expect(getFocusedField()).toBeNull();

    const range = document.createRange();
    range.selectNodeContents(editor);
    document.getSelection()!.addRange(range);
    expect(getEditableSelection()).toBeNull();
    expect(getPageSelection()).toBeNull();
  });
});

describe('fieldKey', () => {
  const key = (html: string) => {
    document.body.innerHTML = html;
    return fieldKey(document.body.firstElementChild as HTMLElement);
  };

  it('prefers stable attributes over a generated id', () => {
    expect(key('<div id="new-message-33bf7bb3-7d00-40c3-b98d-e755b140224a" data-tid="ckeditor" aria-label="Type a message"></div>')).toBe('div|data-tid=ckeditor');
    expect(key('<input id=":r3n:" name="name">')).toBe('input|name=name');
  });

  it('strips volatile parts from an id and falls back to the tag', () => {
    expect(key('<textarea id="note-33bf7bb3-7d00"></textarea>')).toBe(key('<textarea id="note-a1b2c3d4-9f9f"></textarea>'));
    expect(key('<textarea id="comment-12"></textarea>')).toBe('textarea|id=comment-#');
    expect(key('<textarea></textarea>')).toBe('textarea');
  });
});

describe('isSelectionUnchanged', () => {
  it('detects edits made after the snapshot', () => {
    document.body.innerHTML = '<input value="Hello world">';
    const input = document.querySelector('input')!;
    input.focus();
    input.setSelectionRange(0, 5);
    const snapshot = getEditableSelection()!;

    expect(isSelectionUnchanged(snapshot)).toBe(true);
    input.value = 'Howdy world';
    expect(isSelectionUnchanged(snapshot)).toBe(false);
  });
});

describe('getSelectionAnchor', () => {
  // The mirror measurement needs a layout engine; happy-dom has none, so only the fallback is
  // unit-testable here. Positioning itself is checked in a real browser.
  it('falls back to the whole field when the selection cannot be measured', () => {
    document.body.innerHTML = '<input value="Hello world">';
    const input = document.querySelector('input')!;
    input.focus();
    input.setSelectionRange(0, 5);
    const field = input.getBoundingClientRect();

    expect(getSelectionAnchor(getEditableSelection()!)).toEqual({
      x: field.right,
      top: field.top,
      bottom: field.bottom,
    });
  });
});
