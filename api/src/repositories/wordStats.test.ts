import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// Read once at module load (env()), so the file is chosen before the import.
process.env.WORD_STATS_FILE = join(mkdtempSync(join(tmpdir(), 'word-stats-')), 'stats.json');
const { wordStatsRepository } = await import('./wordStats.ts');

it('counts translated words, dictation seconds and dictated words, per day and in total', () => {
  expect(wordStatsRepository.read()).toEqual({ total: 0, byDay: {}, dictationSeconds: { total: 0, byDay: {} }, dictationWords: { total: 0, byDay: {} }, dictationModels: {} });
  wordStatsRepository.add('Hello world', '2026-10-01');
  wordStatsRepository.add('  one  two\nthree ', '2026-10-01');
  wordStatsRepository.add('next', '2026-10-02');
  wordStatsRepository.addDictation(4.26, 9, 'gpt-live-transcribe', '2026-10-01');
  wordStatsRepository.addDictation(8.04, 21, 'gpt-4o-transcribe', '2026-10-01');
  wordStatsRepository.addDictation(0.1, 0, undefined, '2026-10-02'); // failed: no model
  expect(wordStatsRepository.read()).toEqual({
    total: 6,
    byDay: { '2026-10-01': 5, '2026-10-02': 1 },
    dictationSeconds: { total: 12.4, byDay: { '2026-10-01': 12.3, '2026-10-02': 0.1 } },
    dictationWords: { total: 30, byDay: { '2026-10-01': 30, '2026-10-02': 0 } },
    dictationModels: {
      'gpt-live-transcribe': { dictations: 1, seconds: 4.3, words: 9 },
      'gpt-4o-transcribe': { dictations: 1, seconds: 8, words: 21 },
    },
  });
});

it('reads a file written before dictation was tracked', () => {
  writeFileSync(process.env.WORD_STATS_FILE!, JSON.stringify({ total: 2, byDay: { '2026-09-30': 2 } }));
  expect(wordStatsRepository.read()).toEqual({ total: 2, byDay: { '2026-09-30': 2 }, dictationSeconds: { total: 0, byDay: {} }, dictationWords: { total: 0, byDay: {} }, dictationModels: {} });
});
