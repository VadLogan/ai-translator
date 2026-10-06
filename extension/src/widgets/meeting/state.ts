import { emptyTranscript, transcriptReducer, type TranscriptAction, type TranscriptState } from '../../core/transcript';
import type { MeetingLine, MeetingRecord } from '../../settings/meetings';

export type MeetingStatus = 'listening' | 'paused' | 'ended';

export interface Speaker {
  id: string;
  name: string;
  /** The legend dot and the line's name; a fixed hex, readable on both themes. */
  color: string;
}

export interface Line {
  id: string;
  speaker: string;
  /** Seconds since the meeting started. */
  t: number;
  text: string;
}

export interface MeetingState {
  status: MeetingStatus;
  minimized: boolean;
  /** Seconds since the meeting started, paused time excluded. */
  elapsed: number;
  speakers: Speaker[];
  lines: Line[];
  /** The line still being spoken, not yet committed. */
  live: { speaker: string; text: string } | null;
  renaming: string | null;
  /** Highlights, result cards and the user's error counts (`core/transcript.ts`). */
  transcript: TranscriptState;
}

export type MeetingAction =
  | { type: 'tick' }
  | { type: 'line'; line: Line }
  | { type: 'live'; live: MeetingState['live'] }
  | { type: 'toggle-pause' }
  | { type: 'minimize' }
  | { type: 'end' }
  | { type: 'rename-start'; id: string | null }
  | { type: 'rename'; id: string; name: string }
  | { type: 'transcript'; action: TranscriptAction };

/** The user's own speaker id. */
export const ME = 'me';

export const SPEAKER_COLORS = ['#7C3AED', '#0E7A3F', '#46699D'] as const;

export function initialMeeting(speakers: Speaker[]): MeetingState {
  return { status: 'listening', minimized: false, elapsed: 0, speakers, lines: [], live: null, renaming: null, transcript: emptyTranscript() };
}

export function meetingReducer(state: MeetingState, action: MeetingAction): MeetingState {
  switch (action.type) {
    case 'tick':
      return state.status === 'listening' ? { ...state, elapsed: state.elapsed + 1 } : state;
    case 'line':
      return state.status === 'ended' ? state : { ...state, lines: [...state.lines, action.line], live: null };
    case 'live':
      return state.status === 'listening' ? { ...state, live: action.live } : state;
    case 'toggle-pause':
      if (state.status === 'ended') return state;
      return { ...state, status: state.status === 'listening' ? 'paused' : 'listening', live: null };
    case 'minimize':
      return { ...state, minimized: !state.minimized };
    case 'end':
      return { ...state, status: 'ended', live: null };
    case 'rename-start':
      return { ...state, renaming: action.id };
    case 'rename': {
      const name = action.name.trim();
      const speakers = name ? state.speakers.map((s) => (s.id === action.id ? { ...s, name } : s)) : state.speakers;
      return { ...state, speakers, renaming: null };
    }
    case 'transcript':
      return { ...state, transcript: transcriptReducer(state.transcript, action.action) };
  }
}

/**
 * What History → Meetings keeps of an ended meeting: the summary fields and the transcript as text,
 * with the error counts and fixes already fetched. Null when nobody said anything.
 */
export function meetingRecord(state: MeetingState, site: string, startedAt: number): MeetingRecord | null {
  const last = state.lines.at(-1);
  if (!last) return null;
  const name = (id: string) => state.speakers.find((s) => s.id === id)?.name ?? 'Unknown';
  const lines = state.lines.map(({ id, speaker, t, text }): MeetingLine => {
    const check = state.transcript.checks[id];
    const result = state.transcript.results[id];
    return {
      speaker,
      t,
      text,
      ...(check?.status === 'done' ? { errors: check.errors } : {}),
      ...(result?.kind === 'fix' && result.status === 'done' && result.fix ? { fix: result.fix } : {}),
    };
  });
  return {
    at: startedAt,
    site,
    seconds: state.elapsed,
    speakers: new Set(state.lines.map((l) => l.speaker).filter((id) => id !== ME)).size,
    last: `${name(last.speaker)}: ${last.text}`,
    cast: state.speakers.map((s) => ({ ...s, ...(s.id === ME ? { me: true as const } : {}) })),
    lines,
  };
}
