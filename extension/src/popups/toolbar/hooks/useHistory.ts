import { useEffect, useState } from 'react';
import { historyStore, type HistoryEntry } from '../../../settings/history';

/** The local history, with a single Undo for the last delete or clear. */
export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [undo, setUndo] = useState<{ label: string; previous: HistoryEntry[] } | null>(null);

  useEffect(() => void historyStore.get().then(setHistory), []);

  // History edits write the whole list. Delete and clear keep the list before them for Undo.
  const save = async (list: HistoryEntry[]) => setHistory(await historyStore.set(list));
  const remove = (list: HistoryEntry[], label: string) => {
    setUndo({ label, previous: history });
    void save(list);
  };

  return {
    history,
    add: async (entry: HistoryEntry) => setHistory(await historyStore.add(entry)),
    toggleStar: (entry: HistoryEntry) => void save(history.map((e) => (e.at === entry.at ? { ...e, starred: !e.starred } : e))),
    remove: (entry: HistoryEntry) => remove(history.filter((e) => e.at !== entry.at), 'Deleted 1 translation'),
    clearAll: () => remove([], `Cleared ${history.length} translations`),
    undo: undo && { label: undo.label, onUndo: () => (void save(undo.previous), setUndo(null)) },
    /** Undo is offered only until the user leaves History. */
    dropUndo: () => setUndo(null),
  };
}
