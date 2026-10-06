import { useEffect, useMemo, useReducer, useRef } from 'react';
import { transcriptActions } from '../../../core/transcript';
import { transcriptSenders } from '../../../messaging/transcriptSenders';
import { meetingsStore } from '../../../settings/meetings';
import { initialMeeting, ME, meetingRecord, meetingReducer, type MeetingState } from '../state';
import { DEMO_SCRIPT, DEMO_SPEAKERS, PAUSE_WORDS, WORD_MS } from './demoFeed';

/** The live meeting card: the (demo) feed, the clock, the transcript's actions, and saving on End. */
export function useMeeting() {
  const [state, dispatch] = useReducer(meetingReducer, DEMO_SPEAKERS, initialMeeting);
  const latest = useRef<MeetingState>(state);
  latest.current = state;

  const actions = useMemo(
    () => transcriptActions({ ...transcriptSenders(`Meeting · ${location.hostname}`), dispatch: (action) => dispatch({ type: 'transcript', action }) }),
    [],
  );

  // Ending saves the meeting for History → Meetings (once: an ended meeting never changes status again).
  const startedAt = useRef(Date.now());
  useEffect(() => {
    if (state.status !== 'ended') return;
    const record = meetingRecord(latest.current, location.hostname, startedAt.current);
    if (record) void meetingsStore.add(record);
  }, [state.status]);

  // The meeting clock.
  useEffect(() => {
    if (state.status !== 'listening') return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [state.status]);

  // The feed: each line grows word by word as live text, then commits. The user's lines are
  // checked as they commit, so their error count is there before anyone asks. Resumes where it paused.
  const cursor = useRef({ line: 0, word: 0 });
  useEffect(() => {
    if (state.status !== 'listening') return;
    const timer = setInterval(() => {
      const c = cursor.current;
      const next = DEMO_SCRIPT[c.line % DEMO_SCRIPT.length]!;
      const words = next.text.split(' ');
      c.word++;
      if (c.word <= PAUSE_WORDS) return; // a gap of silence between lines
      const spoken = c.word - PAUSE_WORDS;
      if (spoken < words.length) return dispatch({ type: 'live', live: { speaker: next.speaker, text: words.slice(0, spoken).join(' ') } });
      const line = { id: `l${c.line}`, speaker: next.speaker, t: latest.current.elapsed, text: next.text };
      dispatch({ type: 'line', line });
      if (line.speaker === ME) void actions.check(line);
      cursor.current = { line: c.line + 1, word: 0 };
    }, WORD_MS);
    return () => clearInterval(timer);
  }, [state.status, actions]);

  const lineById = (id: string) => latest.current.lines.find((l) => l.id === id);

  return {
    state,
    dispatch,
    onHighlight: (line: string, from: number, to: number) => dispatch({ type: 'transcript', action: { type: 'highlight', highlight: { line, from, to } } }),
    onClearHighlight: () => dispatch({ type: 'transcript', action: { type: 'highlight', highlight: null } }),
    onAction: (id: string, kind: 'translate' | 'explain' | 'vocab') => {
      const line = lineById(id);
      const highlight = latest.current.transcript.highlight;
      if (line && highlight?.line === id) void actions.run(kind, line, highlight);
    },
    onShowFixes: (id: string, open: boolean) => {
      const line = lineById(id);
      if (line) void actions.showFixes(line, open);
    },
    onCloseResult: (line: string) => dispatch({ type: 'transcript', action: { type: 'close-result', line } }),
    onUndoVocab: (line: string) => {
      const result = latest.current.transcript.results[line];
      if (result) void actions.undoVocab(line, result);
    },
  };
}
