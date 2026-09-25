import { describe, expect, it, vi } from 'vitest';

// defineItem reads chrome.storage at load; only the pure helpers are under test.
vi.mock('wxt/utils/storage', () => ({ storage: { defineItem: () => ({}) } }));

import { byDay, defaultPair, HISTORY_LIMIT, orient, pairLabel, topPairs, usedLately, withEntry, type HistoryEntry, type TranslationEntry } from './history';

const DAY = 86_400_000;
const NOW = new Date(2026, 8, 25, 12).getTime();
const entry = (to: string, at: number, from?: string): TranslationEntry => ({ text: 't', result: 'r', to, site: '', at, ...(from ? { from } : {}) });
const grammar = (at: number): HistoryEntry => ({ kind: 'grammar', text: 't', result: 'r', site: '', at });

describe('pairLabel', () => {
  it('reads the pair for a translation and "Grammar" for a fix', () => {
    expect(pairLabel(entry('en', 1, 'pl'))).toBe('PL → EN');
    expect(pairLabel(entry('en', 1))).toBe('EN');
    expect(pairLabel(grammar(1))).toBe('Grammar');
  });
});

describe('withEntry', () => {
  it('puts the new entry first and caps the list', () => {
    const full = Array.from({ length: HISTORY_LIMIT }, (_, i) => entry('de', NOW - i));
    const next = withEntry(full, entry('fr', NOW + 1));
    expect(next).toHaveLength(HISTORY_LIMIT);
    expect(next[0]).toMatchObject({ to: 'fr' });
  });
});

describe('topPairs', () => {
  it('ranks source → target pairs by use, skipping undetected sources', () => {
    const list = [entry('en', 1, 'uk'), entry('en', 2, 'pl'), entry('en', 3, 'pl'), entry('en', 4), grammar(6), grammar(7), grammar(8), entry('pl', 5, 'en')];
    expect(topPairs(list)).toEqual([{ from: 'pl', to: 'en' }, { from: 'uk', to: 'en' }]);
  });
});

describe('defaultPair', () => {
  it('prefers the most used pair, then the first two favorites', () => {
    expect(defaultPair([entry('en', 1, 'uk'), entry('de', 2, 'pl'), entry('de', 3, 'pl')], ['fr', 'it'])).toEqual({ from: 'pl', to: 'de' });
    expect(defaultPair([entry('en', 1), grammar(2)], ['fr', 'it', 'es'])).toEqual({ from: 'fr', to: 'it' });
    expect(defaultPair([], ['fr'])).toBeNull();
  });
});

describe('orient', () => {
  const pair = { from: 'pl', to: 'en' };
  it('keeps, flips or re-sources the pair by the detected language', () => {
    expect(orient(pair, undefined)).toBe(pair);
    expect(orient(pair, 'pl')).toBe(pair);
    expect(orient(pair, 'en')).toEqual({ from: 'en', to: 'pl' });
    expect(orient(pair, 'de')).toEqual({ from: 'de', to: 'en' });
  });
});

describe('byDay', () => {
  it('groups under Today, Yesterday, then the weekday', () => {
    const groups = byDay([entry('a', NOW), entry('b', NOW - 1000), entry('c', NOW - DAY), entry('d', NOW - 3 * DAY)], NOW);
    expect(groups.map((g) => [g.day, g.entries.length])).toEqual([['Today', 2], ['Yesterday', 1], ['Tuesday', 1]]);
  });
});

describe('usedLately', () => {
  it('dedupes, drops favorites, keeps newest first', () => {
    const list = [grammar(4), entry('de', 3), entry('en', 2), entry('fr', 1), entry('de', 0)];
    expect(usedLately(list, ['en'])).toEqual([{ code: 'de', at: 3 }, { code: 'fr', at: 1 }]);
  });

  it('lists sources on the from side, skipping undetected ones', () => {
    const list = [entry('en', 3, 'uk'), entry('en', 2), entry('en', 1, 'pl'), entry('pl', 0, 'uk')];
    expect(usedLately(list, ['pl'], 'from')).toEqual([{ code: 'uk', at: 3 }]);
  });
});
