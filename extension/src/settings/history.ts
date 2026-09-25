import { storage } from 'wxt/utils/storage';

interface Common {
  text: string;
  result: string;
  /** Hostname of the page it was made on; empty on a non-web page. */
  site: string;
  /** Epoch ms; also the entry's id. */
  at: number;
  /** The user's thumbs up / down. Local only: there is no feedback endpoint yet. */
  rating?: 'good' | 'bad';
}

/**
 * One translation (popup or in-page widget) or one applied grammar fix / rewrite. Local to this
 * browser; the server keeps its own rows. No `kind` = a translation, as entries saved before it read.
 */
export type HistoryEntry = Common & ({ kind?: 'translation'; /** Detected or picked. */ from?: string; to: string } | { kind: 'grammar' });
export type TranslationEntry = Extract<HistoryEntry, { to: string }>;

const DAY = 86_400_000;
// No age-based pruning (by choice); the cap alone bounds chrome.storage.
// ponytail: move history server-side if people want more than this.
export const HISTORY_LIMIT = 200;

const item = storage.defineItem<HistoryEntry[]>('local:popupHistory', { fallback: [] });

/** Newest first, capped. */
export const withEntry = (list: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] =>
  [entry, ...list].slice(0, HISTORY_LIMIT);

/** "PL → EN"; an undetected source shows the target alone; a grammar fix reads "Grammar". */
export const pairLabel = (entry: HistoryEntry | Pair): string =>
  !('to' in entry) ? 'Grammar' : `${entry.from ? `${entry.from.toUpperCase()} → ` : ''}${entry.to.toUpperCase()}`;

export type Pair = { from: string; to: string };

/** The most used language pairs, most used first -- the popup's pair chips and the History filter tabs. */
export function topPairs(list: readonly HistoryEntry[], count = 2): Pair[] {
  const uses = new Map<string, { pair: Pair; count: number }>();
  for (const entry of list) {
    if (entry.kind === 'grammar' || !entry.from) continue;
    const key = pairLabel(entry);
    const seen = uses.get(key) ?? { pair: { from: entry.from, to: entry.to }, count: 0 };
    seen.count++;
    uses.set(key, seen);
  }
  return [...uses.values()].sort((a, b) => b.count - a.count).slice(0, count).map(({ pair }) => pair);
}

/** The popup's starting pair: the most used one, else the first two favorites. */
export const defaultPair = (list: readonly HistoryEntry[], favorites: readonly string[]): Pair | null =>
  topPairs(list, 1)[0] ?? (favorites.length >= 2 ? { from: favorites[0]!, to: favorites[1]! } : null);

/** Points the pair at the detected language: its target flips it, any other language becomes the source. */
export function orient(pair: Pair, detected: string | undefined): Pair {
  if (!detected || detected === pair.from) return pair;
  if (detected === pair.to) return { from: pair.to, to: pair.from };
  return { from: detected, to: pair.to };
}

/** Entries under "Today", "Yesterday", or the weekday / date, in list order. */
export function byDay(list: readonly HistoryEntry[], now = Date.now()): { day: string; entries: HistoryEntry[] }[] {
  const today = new Date(now).setHours(0, 0, 0, 0);
  const groups: { day: string; entries: HistoryEntry[] }[] = [];
  for (const entry of list) {
    const start = new Date(entry.at).setHours(0, 0, 0, 0);
    const days = Math.round((today - start) / DAY);
    const day =
      days <= 0 ? 'Today'
      : days === 1 ? 'Yesterday'
      : new Date(entry.at).toLocaleDateString('en', days < 7 ? { weekday: 'long' } : { day: 'numeric', month: 'long' });
    const last = groups.at(-1);
    if (last?.day === day) last.entries.push(entry);
    else groups.push({ day, entries: [entry] });
  }
  return groups;
}

/** Source or target languages from history that aren't favorites, newest first, each with when it was last used. */
export function usedLately(list: readonly HistoryEntry[], favorites: readonly string[], side: 'from' | 'to' = 'to'): { code: string; at: number }[] {
  const seen = new Set(favorites);
  const out: { code: string; at: number }[] = [];
  for (const entry of list) {
    if (entry.kind === 'grammar') continue;
    const code = entry[side];
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push({ code, at: entry.at });
  }
  return out;
}

export const historyStore = {
  get: () => item.getValue(),
  async add(entry: HistoryEntry): Promise<HistoryEntry[]> {
    const list = withEntry(await item.getValue(), entry);
    await item.setValue(list);
    return list;
  },
  /** Rating, deleting, clearing and undoing all write the whole list. */
  async set(list: HistoryEntry[]): Promise<HistoryEntry[]> {
    await item.setValue(list);
    return list;
  },
};
