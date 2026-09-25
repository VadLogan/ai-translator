import { storage } from 'wxt/utils/storage';

/** One translation made in the toolbar popup. Local to this browser; the server keeps its own rows. */
export interface HistoryEntry {
  text: string;
  result: string;
  /** The source language, when it was detected or picked. */
  from?: string;
  to: string;
  /** Hostname of the tab the popup was opened over; empty on a non-web page. */
  site: string;
  /** Epoch ms; also the entry's id. */
  at: number;
  /** The user's thumbs up / down. Local only: there is no feedback endpoint yet. */
  rating?: 'good' | 'bad';
}

const DAY = 86_400_000;
// No age-based pruning (by choice); the cap alone bounds chrome.storage.
// ponytail: move history server-side if people want more than this.
export const HISTORY_LIMIT = 200;

const item = storage.defineItem<HistoryEntry[]>('local:popupHistory', { fallback: [] });

/** Newest first, capped. */
export const withEntry = (list: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] =>
  [entry, ...list].slice(0, HISTORY_LIMIT);

/** "PL → EN"; an undetected source shows the target alone. */
export const pairLabel = ({ from, to }: Pick<HistoryEntry, 'from' | 'to'>): string =>
  `${from ? `${from.toUpperCase()} → ` : ''}${to.toUpperCase()}`;

/** The most used language pairs, most used first -- the History filter tabs. */
export function topPairs(list: readonly HistoryEntry[], count = 2): string[] {
  const uses = new Map<string, number>();
  for (const entry of list) if (entry.from) uses.set(pairLabel(entry), (uses.get(pairLabel(entry)) ?? 0) + 1);
  return [...uses].sort((a, b) => b[1] - a[1]).slice(0, count).map(([pair]) => pair);
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

/** Target languages from history that aren't favorites, newest first, each with when it was last used. */
export function usedLately(list: readonly HistoryEntry[], favorites: readonly string[]): { code: string; at: number }[] {
  const seen = new Set(favorites);
  const out: { code: string; at: number }[] = [];
  for (const { to, at } of list) {
    if (seen.has(to)) continue;
    seen.add(to);
    out.push({ code: to, at });
  }
  return out;
}

export const popupHistory = {
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
