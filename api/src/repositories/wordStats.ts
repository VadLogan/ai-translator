import { readFileSync, writeFileSync } from 'node:fs';
import { env } from '../env.ts';

// ponytail: a dev-only JSON file, read and written synchronously per request in one process. The
// deployed edge function has no writable disk, so there it counts nothing (the write throws and the
// controller logs it). Move to a table if the numbers must be real.
const file = env('WORD_STATS_FILE') ?? new URL('../../word-stats.json', import.meta.url);

type Counter = { total: number; byDay: Record<string, number> };

/**
 * Source words of successful translations (`total`, `byDay`), seconds spent dictating
 * (`dictationSeconds`) and the words dictated (`dictationWords`); days are UTC `YYYY-MM-DD`. The
 * translated words stay at the top level, as GET /stats returned them before dictation was added.
 */
export type WordStats = Counter & { dictationSeconds: Counter; dictationWords: Counter; dictationModels: Record<string, ModelUse> };

/** One transcription model's share of the dictations, in total. */
type ModelUse = { dictations: number; seconds: number; words: number };

const today = () => new Date().toISOString().slice(0, 10);
// Tenths, so float seconds don't pile up into 12.300000000000001; whole words are unchanged by it.
const round = (n: number) => Math.round(n * 10) / 10;
const bump = (counter: Counter, amount: number, day: string) => {
  counter.total = round(counter.total + amount);
  counter.byDay[day] = round((counter.byDay[day] ?? 0) + amount);
};

export const wordStatsRepository = {
  read(): WordStats {
    let stored: Partial<WordStats> = {};
    try {
      stored = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      // no file yet
    }
    // A file written before dictation was tracked lacks its counters.
    const empty = (): Counter => ({ total: 0, byDay: {} });
    return {
      total: stored.total ?? 0,
      byDay: stored.byDay ?? {},
      dictationSeconds: stored.dictationSeconds ?? empty(),
      dictationWords: stored.dictationWords ?? empty(),
      dictationModels: stored.dictationModels ?? {},
    };
  },

  add(text: string, day = today()): void {
    const stats = wordStatsRepository.read();
    bump(stats, text.trim().split(/\s+/).length, day);
    writeFileSync(file, JSON.stringify(stats, null, 2));
  },

  /** One recording: its length in seconds, its transcript's words, and the model that transcribed it (none: it failed). */
  addDictation(seconds: number, words = 0, model?: string, day = today()): void {
    const stats = wordStatsRepository.read();
    bump(stats.dictationSeconds, seconds, day);
    bump(stats.dictationWords, words, day);
    if (model) {
      const use = (stats.dictationModels[model] ??= { dictations: 0, seconds: 0, words: 0 });
      use.dictations += 1;
      use.seconds = round(use.seconds + seconds);
      use.words += words;
    }
    writeFileSync(file, JSON.stringify(stats, null, 2));
  },
};
