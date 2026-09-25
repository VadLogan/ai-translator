import { describe, expect, it } from 'vitest';
import { browserLanguages, nativeName, searchLanguages } from './languages';

describe('browserLanguages', () => {
  it('reduces regional tags to supported base codes, deduped, in order', () => {
    expect(browserLanguages(['en-US', 'uk', 'en-GB', 'PL-pl', 'xx'])).toEqual(['en', 'uk', 'pl']);
  });

  it('falls back to English when nothing is supported', () => {
    expect(browserLanguages(['xx-YY'])).toEqual(['en']);
    expect(browserLanguages([])).toEqual(['en']);
  });
});

describe('nativeName', () => {
  it('names a language in itself, capitalised', () => {
    expect(nativeName('pl')).toBe('Polski');
    expect(nativeName('uk')).toBe('Українська');
  });
});

describe('searchLanguages', () => {
  it('matches English name, native name and code', () => {
    expect(searchLanguages('pol').map((l) => l.code)).toEqual(['pl']);
    expect(searchLanguages('deutsch').map((l) => l.code)).toEqual(['de']);
    expect(searchLanguages('uk').map((l) => l.code)).toContain('uk');
  });
});
