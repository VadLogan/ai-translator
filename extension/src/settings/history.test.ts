import { describe, expect, it, vi } from 'vitest';

// defineItem reads chrome.storage at load; only the pure helpers are under test.
vi.mock('wxt/utils/storage', () => ({ storage: { defineItem: () => ({}) } }));

import { byDay, HISTORY_LIMIT, topPairs, usedLately, withEntry, type HistoryEntry } from './history';

const DAY = 86_400_000;
const NOW = new Date(2026, 8, 25, 12).getTime();
const entry = (to: string, at: number, from?: string): HistoryEntry => ({ text: 't', result: 'r', to, site: '', at, ...(from ? { from } : {}) });

describe('withEntry', () => {
  it('puts the new entry first and caps the list', () => {
    const full = Array.from({ length: HISTORY_LIMIT }, (_, i) => entry('de', NOW - i));
    const next = withEntry(full, entry('fr', NOW + 1));
    expect(next).toHaveLength(HISTORY_LIMIT);
    expect(next[0]!.to).toBe('fr');
  });
});

describe('topPairs', () => {
  it('ranks source → target pairs by use, skipping undetected sources', () => {
    const list = [entry('en', 1, 'uk'), entry('en', 2, 'pl'), entry('en', 3, 'pl'), entry('en', 4), entry('pl', 5, 'en')];
    expect(topPairs(list)).toEqual(['PL → EN', 'UK → EN']);
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
    const list = [entry('de', 3), entry('en', 2), entry('fr', 1), entry('de', 0)];
    expect(usedLately(list, ['en'])).toEqual([{ code: 'de', at: 3 }, { code: 'fr', at: 1 }]);
  });
});
