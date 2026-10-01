import { readFileSync, writeFileSync } from 'node:fs';

// ponytail: dev-only JSON file, sync read/write per request, single process; move to a DB table if it must be real.
const file = process.env.WORD_STATS_FILE ?? new URL('../word-stats.json', import.meta.url);

/** Source words of successful translations; days are UTC `YYYY-MM-DD`. */
export type WordStats = { total: number; byDay: Record<string, number> };

export function readWordStats(): WordStats {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return { total: 0, byDay: {} };
  }
}

export function addWords(text: string, day = new Date().toISOString().slice(0, 10)): void {
  const stats = readWordStats();
  const words = text.trim().split(/\s+/).length;
  stats.total += words;
  stats.byDay[day] = (stats.byDay[day] ?? 0) + words;
  writeFileSync(file, JSON.stringify(stats, null, 2));
}
