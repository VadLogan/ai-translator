import { describe, expect, it } from 'vitest';
import { isSiteDisabled, parseSites } from './sites';

describe('isSiteDisabled', () => {
  it('matches the site and its subdomains, not look-alikes', () => {
    const list = ['example.com'];
    expect(isSiteDisabled('example.com', list)).toBe(true);
    expect(isSiteDisabled('mail.Example.com', list)).toBe(true);
    expect(isSiteDisabled('notexample.com', list)).toBe(false);
    expect(isSiteDisabled('example.com.evil.io', list)).toBe(false);
    expect(isSiteDisabled('example.com', [])).toBe(false);
  });
});

describe('parseSites', () => {
  it('reduces urls to lower-case hostnames and drops duplicates', () => {
    expect(parseSites('https://www.Bank.com/login?x=1\nbank.com, mail.google.com:443 \n\n')).toEqual({
      sites: ['bank.com', 'mail.google.com'],
      invalid: [],
    });
  });

  it('reports what is not a hostname', () => {
    expect(parseSites('ok.com not_a%host')).toEqual({ sites: ['ok.com'], invalid: ['not_a%host'] });
  });
});
