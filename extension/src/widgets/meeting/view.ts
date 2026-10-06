import { clock, lineView, type TranscriptLineView } from '../../core/transcript';
import { ME, type MeetingState } from './state';

export interface MeetingView {
  status: MeetingState['status'];
  statusLabel: string;
  elapsed: string;
  minimized: boolean;
  speakers: { id: string; name: string; color: string }[];
  renaming: string | null;
  lines: TranscriptLineView[];
  live: { name: string; color: string; text: string } | null;
}

const STATUS_LABEL = { listening: 'Listening', paused: 'Paused', ended: 'Ended' } as const;

export function toView(state: MeetingState): MeetingView {
  const speaker = (id: string) => {
    const { name, color } = state.speakers.find((s) => s.id === id) ?? { name: 'Unknown', color: '#71717A' };
    return { name, color };
  };
  return {
    status: state.status,
    statusLabel: STATUS_LABEL[state.status],
    elapsed: clock(state.elapsed),
    minimized: state.minimized,
    speakers: state.speakers,
    renaming: state.renaming,
    lines: state.lines.map((line) => lineView(state.transcript, { ...line, me: line.speaker === ME }, speaker(line.speaker))),
    live: state.live && state.status === 'listening' ? { ...speaker(state.live.speaker), text: state.live.text } : null,
  };
}
