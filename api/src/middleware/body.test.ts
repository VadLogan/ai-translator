import { describe, expect, it } from 'vitest';
import { parseTranslateBody } from './body.ts';

describe('parseDetectBody', () => {
  it('trims the text, for every route built on it', () => {
    expect(parseTranslateBody({ text: '  hi there \n', targetLang: 'de' })).toEqual({ text: 'hi there', targetLang: 'de' });
  });
});
