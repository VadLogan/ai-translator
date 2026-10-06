import { IconButton } from '../../components/buttons';
import { BrandMark, Icon } from '../../components/icons';
import { SpeakerLegend, TranscriptLine, type TranscriptCallbacks } from '../../components/Transcript';
import type { MeetingView } from './view';

export interface MeetingCallbacks extends TranscriptCallbacks {
  onTogglePause: () => void;
  onMinimize: () => void;
  onEnd: () => void;
  onRenameStart: (speakerId: string | null) => void;
  onRename: (speakerId: string, name: string) => void;
}

const DOT = {
  listening: 'bg-tm-success motion-safe:animate-pulse',
  paused: 'bg-tm-warning',
  ended: 'bg-tm-placeholder',
} as const;

/** The meeting card, fixed bottom right. Presentational: everything comes from `view`. */
export function MeetingPanel({ view, dark, callbacks }: { view: MeetingView; dark: boolean; callbacks: MeetingCallbacks }) {
  return (
    <div className={`${dark ? 'dark' : 'light'} font-tm tm-body text-tm-ink`}>
      <div
        role="dialog"
        aria-label="TypeMeant meeting"
        className="fixed right-6 bottom-24 flex w-[400px] flex-col overflow-hidden rounded-[20px] bg-tm-surface shadow-tm-pop motion-safe:animate-tm-appear"
      >
        <Header view={view} callbacks={callbacks} />
        {!view.minimized && (
          <>
            <SpeakerLegend
              className="px-3.5 pt-2 pb-0.5"
              speakers={view.speakers}
              renaming={view.renaming}
              onRenameStart={callbacks.onRenameStart}
              onRename={callbacks.onRename}
              hint="Click a name to rename"
            />
            <Transcript view={view} callbacks={callbacks} />
            <div className="shrink-0 border-t border-tm-line px-3.5 pt-2 pb-2.5 text-[12px] text-tm-muted">
              Highlight words to translate, explain or save · your lines show their errors
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Header({ view, callbacks }: { view: MeetingView; callbacks: MeetingCallbacks }) {
  const ended = view.status === 'ended';
  return (
    <div className={`flex h-[52px] shrink-0 items-center gap-2.5 pr-2 pl-3.5 ${view.minimized ? '' : 'border-b border-tm-line'}`}>
      <BrandMark size={24} />
      <span className="flex min-w-0 grow flex-col gap-px">
        <span className="text-[13.5px] font-semibold">Meeting</span>
        <span className="flex items-center gap-1.5 text-[12px] text-tm-muted">
          <span className={`size-[7px] rounded-full ${DOT[view.status]}`} />
          <span className="tabular-nums">
            {view.statusLabel} · {view.elapsed}
          </span>
        </span>
      </span>
      {!ended && (
        <IconButton aria-label={view.status === 'paused' ? 'Resume' : 'Pause'} onPress={callbacks.onTogglePause}>
          <Icon name={view.status === 'paused' ? 'play' : 'pause'} size={14} strokeWidth={2.2} />
        </IconButton>
      )}
      <IconButton aria-label={view.minimized ? 'Expand' : 'Minimize'} tone="ghost" onPress={callbacks.onMinimize}>
        <Icon name={view.minimized ? 'chevronDown' : 'minimize'} size={14} strokeWidth={2.2} className={view.minimized ? 'rotate-180' : ''} />
      </IconButton>
      <button
        type="button"
        onClick={callbacks.onEnd}
        className="h-8 cursor-pointer rounded-full border-0 bg-tm-danger-soft px-3 text-[13px] font-semibold text-tm-danger-ink hover:bg-tm-danger-soft/80"
      >
        {ended ? 'Close' : 'End'}
      </button>
    </div>
  );
}



function Transcript({ view, callbacks }: { view: MeetingView; callbacks: MeetingCallbacks }) {
  return (
    // column-reverse keeps the scroll pinned to the newest line as lines arrive.
    <div className="flex h-80 flex-col-reverse overflow-y-auto">
      <div className="flex flex-col gap-0.5 px-1.5 pt-1 pb-1.5">
        {view.lines.length === 0 && !view.live && <p className="px-2.5 py-6 text-center text-[13px] text-tm-muted">Waiting for someone to speak…</p>}
        {view.lines.map((line) => (
          <TranscriptLine key={line.id} line={line} callbacks={callbacks} />
        ))}
        {view.live && (
          <div className="flex flex-col gap-0.5 px-2.5 py-2">
            <span className="flex items-baseline gap-2">
              <span className="text-[12.5px] font-semibold" style={{ color: view.live.color }}>
                {view.live.name}
              </span>
              <span className="text-[11.5px] text-tm-placeholder">now</span>
            </span>
            <span className="text-[13.5px] leading-[1.45] text-tm-muted">
              {view.live.text}
              <span className="ml-1 inline-block size-1.5 rounded-full bg-tm-placeholder align-[2px] motion-safe:animate-pulse" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
