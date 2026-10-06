import { storage } from 'wxt/utils/storage';
import type { FixEdit } from '../../../shared/contract';
import { dayLabel } from './history';

export interface MeetingSpeaker {
  id: string;
  name: string;
  color: string;
  /** The user. */
  me?: true;
}

export interface MeetingLine {
  speaker: string;
  /** Seconds since the meeting started. */
  t: number;
  text: string;
  /** The user's own lines: how many errors /check counted. */
  errors?: number;
  /** The user's own lines: the fix, once asked ("Show fixes"). */
  fix?: { text: string; edits: FixEdit[] };
}

/**
 * One ended meeting, as History → Meetings lists it: the summary fields, and the transcript as text
 * (never audio). Local to this browser (chrome.storage.local), like the translation history.
 * `cast` / `lines` / `summary` are optional: meetings saved before transcripts were kept lack them.
 */
export interface MeetingRecord {
  /** Epoch ms the meeting started; also its id. */
  at: number;
  /** Hostname of the tab it ran on. */
  site: string;
  seconds: number;
  /** Speakers other than "You". */
  speakers: number;
  /** The last line, "Name: text". */
  last: string;
  cast?: MeetingSpeaker[];
  lines?: MeetingLine[];
  /** The key points, once asked (/summarize). */
  summary?: string[];
}

export const MEETINGS_LIMIT = 100;

/** What "copy a note for the chat" puts on the clipboard: others aren't told automatically. */
export const CHAT_NOTE = "Heads-up: I'm using TypeMeant to transcribe this meeting for myself. Text only, no audio is kept.";

export const speakersLabel = (n: number): string => `${n} speaker${n === 1 ? '' : 's'} and you`;

/** The transcript as plain text, one "Name (m:ss): text" per line: the detail screen's Copy. */
export function transcriptText(record: MeetingRecord): string {
  const name = (id: string) => record.cast?.find((s) => s.id === id)?.name ?? 'Unknown';
  const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  return (record.lines ?? []).map((l) => `${name(l.speaker)} (${clock(l.t)}): ${l.text}`).join('\n');
}

export const durationLabel = (seconds: number): string => `${Math.max(1, Math.round(seconds / 60))} min`;

/** "12:21", the 24-hour clock the design uses. */
export const timeLabel = (at: number): string => new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** The detail screen's subtitle: "Today 12:21 · 37 min". */
export const whenLabel = (record: MeetingRecord, now = Date.now()): string => `${dayLabel(record.at, now)} ${timeLabel(record.at)} · ${durationLabel(record.seconds)}`;

/** Newest first, capped; a record with an existing `at` replaces it. */
export const withMeeting = (list: readonly MeetingRecord[], record: MeetingRecord): MeetingRecord[] =>
  [record, ...list.filter((m) => m.at !== record.at)].slice(0, MEETINGS_LIMIT);

const item = storage.defineItem<MeetingRecord[]>('local:meetings', { fallback: [] });

export const meetingsStore = {
  get: () => item.getValue(),
  async add(record: MeetingRecord): Promise<MeetingRecord[]> {
    const list = withMeeting(await item.getValue(), record);
    await item.setValue(list);
    return list;
  },
  /** Writes back what the detail screen fetched (error counts, fixes, the summary). */
  async update(at: number, patch: (record: MeetingRecord) => MeetingRecord): Promise<MeetingRecord[]> {
    const list = (await item.getValue()).map((m) => (m.at === at ? patch(m) : m));
    await item.setValue(list);
    return list;
  },
  /** Clearing, deleting and undoing write the whole list. */
  async set(list: MeetingRecord[]): Promise<MeetingRecord[]> {
    await item.setValue(list);
    return list;
  },
};
