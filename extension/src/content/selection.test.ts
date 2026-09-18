// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { getEditableSelection, getSelectionAnchor, isSelectionUnchanged } from './selection';

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
  it('brackets the pointer line in a text field so the icon can sit above it', () => {
    document.body.innerHTML = '<textarea style="line-height: 20px">Hello world</textarea>';
    const textarea = document.querySelector('textarea')!;
    textarea.focus();
    textarea.setSelectionRange(0, 5);

    expect(getSelectionAnchor(getEditableSelection()!, { x: 50, y: 100 })).toEqual({ x: 50, top: 90, bottom: 110 });
  });
});
