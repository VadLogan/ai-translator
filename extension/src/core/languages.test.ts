import { describe, expect, it } from 'vitest';
import { browserLanguages } from './languages';

describe('browserLanguages', () => {
  it('reduces regional tags to supported base codes, deduped, in order', () => {
    expect(browserLanguages(['en-US', 'uk', 'en-GB', 'PL-pl', 'xx'])).toEqual(['en', 'uk', 'pl']);
  });

  it('falls back to English when nothing is supported', () => {
    expect(browserLanguages(['xx-YY'])).toEqual(['en']);
    expect(browserLanguages([])).toEqual(['en']);
  });
});
