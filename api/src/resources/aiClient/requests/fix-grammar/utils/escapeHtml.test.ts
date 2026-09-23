import { expect, it } from 'vitest';
import { escapeHtml } from './escapeHtml.ts';

it('escapes every character that can open a tag, entity or attribute', () => {
  expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe('&#60;a href=&#34;x&#34; title=&#39;y&#39;&#62;&#38;&#60;/a&#62;');
});

it('leaves other text untouched', () => {
  expect(escapeHtml('Привіт, світ! 👋 a/b = c')).toBe('Привіт, світ! 👋 a/b = c');
  expect(escapeHtml('')).toBe('');
});

it('escapes an existing entity instead of passing it through', () => {
  expect(escapeHtml('&amp;')).toBe('&#38;amp;');
});
