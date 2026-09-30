import { describe, expect, it } from 'vitest';
import { parseFixGrammarBody, parseTranslateBody } from './body.ts';

describe('parseDetectBody', () => {
  it('trims the text, for every route built on it', () => {
    expect(parseTranslateBody({ text: '  hi there \n', targetLang: 'de' })).toEqual({ text: 'hi there', targetLang: 'de' });
  });
});

describe('parseFixGrammarBody', () => {
  it('keeps guarded only when true, and rejects a non-boolean', () => {
    expect(parseFixGrammarBody({ text: 'hi', guarded: true })).toEqual({ text: 'hi', guarded: true });
    expect(parseFixGrammarBody({ text: 'hi', guarded: false })).toEqual({ text: 'hi' });
    expect(parseFixGrammarBody({ text: 'hi', guarded: 'yes' })).toBe('guarded must be a boolean');
  });
});
