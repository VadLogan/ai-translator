import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import { CHAT_NOTE, meetingsStore, type MeetingRecord } from '../../../settings/meetings';

/** History → Meetings: the saved meetings with a single Undo for Clear all, Start on the tab, and the chat note. */
export function useMeetings() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [undo, setUndo] = useState<{ label: string; previous: MeetingRecord[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => void meetingsStore.get().then(setMeetings), []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (message: string) => {
    setNotice(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 2000);
  };
  const save = async (list: MeetingRecord[]) => setMeetings(await meetingsStore.set(list));

  return {
    meetings,
    notice,
    clearAll: () => {
      setUndo({ label: `Cleared ${meetings.length} meeting${meetings.length === 1 ? '' : 's'}`, previous: meetings });
      void save([]);
    },
    /** The detail screen's Delete; Undo puts it back. */
    remove: (record: MeetingRecord) => {
      setUndo({ label: 'Deleted 1 meeting', previous: meetings });
      void save(meetings.filter((m) => m.at !== record.at));
    },
    /** The detail screen wrote back what it fetched; keep the list in step. */
    reload: () => void meetingsStore.get().then(setMeetings),
    undo: undo && { label: undo.label, onUndo: () => (void save(undo.previous), setUndo(null)) },
    /** Undo is offered only until the user leaves History. */
    dropUndo: () => setUndo(null),
    /** Opens the meeting card on the tab; only its top frame answers. */
    start: async (tabId: number | undefined) => {
      const started = tabId !== undefined && (await browser.tabs.sendMessage(tabId, { type: 'start-meeting' }).catch(() => undefined));
      if (started) window.close();
      else flash("Can't start a meeting on this page.");
    },
    copyNote: () => void navigator.clipboard.writeText(CHAT_NOTE).then(() => flash('Copied — paste it into the meeting chat')),
  };
}
