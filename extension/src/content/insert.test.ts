// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { insertIntoFocusedField } from './insert';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('insertIntoFocusedField', () => {
  it('inserts at the caret of the focused textarea', () => {
    document.body.innerHTML = '<textarea>Hello !</textarea>';
    const textarea = document.querySelector('textarea')!;
    textarea.focus();
    textarea.setSelectionRange(6, 6);

    expect(insertIntoFocusedField(document, 'world')).toBe(true);
    expect(textarea.value).toBe('Hello world!');
  });

  it('refuses when nothing, or an excluded field, is focused', () => {
    expect(insertIntoFocusedField(document, 'x')).toBe(false);
    document.body.innerHTML = '<input type="password">';
    document.querySelector('input')!.focus();
    expect(insertIntoFocusedField(document, 'x')).toBe(false);
  });
});
