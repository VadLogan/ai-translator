import { describe, expect, it } from 'vitest';
import type { VocabException } from '../../../shared/contract.ts';
import { mask, tokensOf } from './exceptions.ts';
import { exceptionOf, findExceptions, similarity } from '../../../shared/exceptions.ts';

const x = (term: string, kind: VocabException['kind'] = 'Brand', replaces: string[] = []): VocabException => ({ term, kind, replaces });

describe('mask', () => {
  it('masks whole words only and restores them', () => {
    const { text, restore } = mask('Jira, not Jirafe; jira', [x('Jira')]);
    // "jira" differs only in case: a near miss, so it comes back as the term.
    expect(text).toBe('{{1}}, not Jirafe; {{2}}');
    expect(restore('In {{1}} today')).toBe('In Jira today');
  });

  it('turns a wrong form into the term, in any case', () => {
    const { text, restore } = mask('open jira or JIRA', [x('Jira', 'Brand', ['jira'])]);
    expect(text).toBe('open {{1}} or {{2}}');
    expect(restore(text)).toBe('open Jira or Jira');
  });

  it('numbers after the mentions and leaves them alone', () => {
    const { text, restore } = mask('{{1}} and {{2}} use kubectl', [x('kubectl', 'Code'), x('1', 'Code')]);
    expect(text).toBe('{{1}} and {{2}} use {{3}}');
    expect(restore('{{2}} {{1}} {{3}}')).toBe('{{2}} {{1}} kubectl');
  });

  it('takes the longest form first and handles Cyrillic', () => {
    const { text, restore } = mask('Укрпошта Експрес і Укрпошта', [x('Укрпошта'), x('Укрпошта Експрес')]);
    expect(text).toBe('{{1}} і {{2}}');
    expect(restore(text)).toBe('Укрпошта Експрес і Укрпошта');
  });

  it('masks only the asked kinds; a dropped token is gone', () => {
    const { text, restore } = mask('Olena uses Jira', [x('Olena', 'Name'), x('Jira')], ['Brand', 'Code']);
    expect(text).toBe('Olena uses {{1}}');
    expect(restore('Olena uses it')).toBe('Olena uses it');
  });

  it('escapes regex characters', () => {
    expect(mask('I like C++ a lot', [x('C++', 'Code')]).text).toBe('I like {{1}} a lot');
  });
});

it('tokensOf compares token sets', () => {
  expect(tokensOf('a {{2}} b {{1}}')).toBe(tokensOf('{{1}}{{2}}'));
  expect(tokensOf('a {{2}}')).not.toBe(tokensOf('a'));
});

it('exceptionOf finds the exception an edit spells out', () => {
  const jira = x('Jira', 'Brand', ['jira']);
  expect(exceptionOf({ original: 'jira', replacement: 'Jira' }, [jira])).toBe(jira);
  expect(exceptionOf({ original: 'i', replacement: 'I' }, [jira])).toBeUndefined();
  expect(findExceptions('open jira in Jira', [jira]).map((h) => h.wrong)).toEqual([true, false]);
});

describe('near misses (at least 80% alike, no model)', () => {
  const typemeant = x('Typemeant', 'Brand', ['typeMeant']);

  it('takes a word one letter off as a wrong form and restores the term', () => {
    const { text, restore } = mask('try typemeans and typemeant today', [typemeant]);
    expect(text).toBe('try {{1}} and {{2}} today');
    expect(restore(text)).toBe('try Typemeant and Typemeant today');
    expect(exceptionOf({ original: 'typemeans', replacement: 'Typemeant' }, [typemeant])).toBe(typemeant);
  });

  it('leaves words under 80% alone', () => {
    expect(similarity('Jira', 'Gira')).toBe(0.75);
    expect(mask('ask Gira about type', [x('Jira'), typemeant]).text).toBe('ask Gira about type');
  });

  it('never matches inside a token', () => {
    expect(mask('{{1}} typemeans', [x('11', 'Code'), typemeant]).text).toBe('{{1}} {{2}}');
  });
});
