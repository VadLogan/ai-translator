import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

process.env.WORD_STATS_FILE = join(mkdtempSync(join(tmpdir(), 'word-stats-')), 'stats.json');
const { addWords, readWordStats } = await import('./word-stats.ts');

it('counts words per day and in total', () => {
  expect(readWordStats()).toEqual({ total: 0, byDay: {} });
  addWords('Hello world', '2026-10-01');
  addWords('  one  two\nthree ', '2026-10-01');
  addWords('next', '2026-10-02');
  expect(readWordStats()).toEqual({ total: 6, byDay: { '2026-10-01': 5, '2026-10-02': 1 } });
});
