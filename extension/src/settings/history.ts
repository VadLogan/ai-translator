import { storage } from 'wxt/utils/storage';

interface Common {
  text: string;
  result: string;
  /** Hostname of the page it was made on; empty on a non-web page. */
  site: string;
  /** Epoch ms; also the entry's id. */
  at: number;
  /** Starred by the user. Local only: there is no feedback endpoint yet. */
  starred?: boolean;
  /** The text was dictated (voice input), not typed or selected. */
  voice?: true;
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

/** Newest first, capped. An entry with an existing `at` replaces it (a grammar fix run rewriting its one entry). */
export const withEntry = (list: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] =>
  [entry, ...list.filter((e) => e.at !== entry.at)].slice(0, HISTORY_LIMIT);

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

/**
 * The target of the user's usual pair for `source`: the most used pair starting from it, else one
 * ending in it, flipped (PL→UA suggests PL for Ukrainian text). `pairs` most used first (`topPairs`).
 */
export function pairFor(pairs: readonly Pair[], source: string | undefined): string | undefined {
  if (!source) return undefined;
  return pairs.find((pair) => pair.from === source)?.to ?? pairs.find((pair) => pair.to === source)?.from;
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

/** "Today", "Yesterday", or the weekday / date. */
export function dayLabel(at: number, now = Date.now()): string {
  const days = Math.round((new Date(now).setHours(0, 0, 0, 0) - new Date(at).setHours(0, 0, 0, 0)) / DAY);
  return days <= 0 ? 'Today'
    : days === 1 ? 'Yesterday'
    : new Date(at).toLocaleDateString('en', days < 7 ? { weekday: 'long' } : { day: 'numeric', month: 'long' });
}

/** Entries under their `dayLabel`, in list order. */
export function byDay(list: readonly HistoryEntry[], now = Date.now()): { day: string; entries: HistoryEntry[] }[] {
  const groups: { day: string; entries: HistoryEntry[] }[] = [];
  for (const entry of list) {
    const day = dayLabel(entry.at, now);
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

/** Favorites reordered by how often history used them on that side, most used first; ties keep the favorites' order. */
export function byUse(favorites: readonly string[], list: readonly HistoryEntry[], side: 'from' | 'to' = 'to'): string[] {
  const uses = new Map<string, number>();
  for (const entry of list) {
    const code = entry.kind === 'grammar' ? undefined : entry[side];
    if (code) uses.set(code, (uses.get(code) ?? 0) + 1);
  }
  return [...favorites].sort((a, b) => (uses.get(b) ?? 0) - (uses.get(a) ?? 0));
}

/** Pinned languages first, then the other favorites; each once. */
export const pinFirst = (pinned: readonly string[], favorites: readonly string[]): string[] => [...new Set([...pinned, ...favorites])];

/**
 * The popup's "Translate into" list, also the in-page menu's: every pinned language, then the most
 * used other favorites up to 3 in all, then "Used lately".
 */
export const intoLanguages = (favorites: readonly string[], list: readonly HistoryEntry[], pinned: readonly string[] = []) => ({
  yours: [...pinned, ...byUse(favorites.filter((code) => !pinned.includes(code)), list)].slice(0, Math.max(3, pinned.length)),
  lately: usedLately(list, pinFirst(pinned, favorites), 'to'),
});

export const historyStore = {
  get: () => item.getValue(),
  async add(entry: HistoryEntry): Promise<HistoryEntry[]> {
    const list = withEntry(await item.getValue(), entry);
    await item.setValue(list);
    return list;
  },
  /** Starring, deleting, clearing and undoing all write the whole list. */
  async set(list: HistoryEntry[]): Promise<HistoryEntry[]> {
    await item.setValue(list);
    return list;
  },
};
