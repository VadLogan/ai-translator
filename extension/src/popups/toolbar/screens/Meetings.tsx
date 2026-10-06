import { PillButton } from '../../../components/buttons';
import { Text } from '../../../components/typography';
import { byDay } from '../../../settings/history';
import { durationLabel, speakersLabel, timeLabel, type MeetingRecord } from '../../../settings/meetings';

export interface MeetingsProps {
  meetings: readonly MeetingRecord[];
  /** The tab's host when a meeting can start on it; null hides the Start card. */
  startHost: string | null;
  onStart(): void;
  onCopyNote(): void;
  onClearAll(): void;
  /** A meeting card: its transcript (the detail screen). */
  onOpen(record: MeetingRecord): void;
  /** A short message in place of the Start card's note ("Copied", "Can't start…"). */
  notice: string | null;
  undo: { label: string; onUndo(): void } | null;
  /** Any meeting saved at all; `meetings` may be a search's subset. */
  hasSaved: boolean;
}

/** History's Meetings tab: start one on this tab, the saved ones by day, Clear all. */
export function Meetings({ meetings, startHost, onStart, onCopyNote, onClearAll, onOpen, notice, undo, hasSaved }: MeetingsProps) {
  return (
    <>
      <div className="flex min-h-0 grow flex-col gap-2 overflow-y-auto px-4 pb-3.5">
        {startHost && (
          <div className="flex flex-col gap-2 rounded-[20px] bg-tm-soft px-3.5 py-3">
            <span className="flex items-center gap-2">
              <span className="flex min-w-0 grow flex-col gap-px">
                <span className="truncate text-[13.5px] font-semibold text-tm-ink">This tab: {startHost}</span>
                <span className="text-[12px] text-tm-accent-text">Uses your mic and this tab's sound</span>
              </span>
              <PillButton variant="primary" size="sm" onPress={onStart}>Start</PillButton>
            </span>
            <span className="text-[12px] text-tm-accent-text" aria-live="polite">
              {notice ?? (
                <>
                  Others aren't told automatically —{' '}
                  <button type="button" onClick={onCopyNote} className="cursor-pointer border-0 bg-transparent p-0 text-inherit underline underline-offset-[3px]">
                    copy a note for the chat
                  </button>
                </>
              )}
            </span>
          </div>
        )}
        {meetings.length === 0 && <Text variant="helper" className="px-1 pt-1">{hasSaved ? 'Nothing matches.' : 'No meetings yet.'}</Text>}
        {byDay(meetings).map(({ day, entries }) => (
          <div key={day} className="flex flex-col gap-2 pt-1">
            <Text variant="groupLabel" tone="secondary" className="px-1">{day}</Text>
            {entries.map((m) => (
              <button
                type="button"
                key={m.at}
                onClick={() => onOpen(m)}
                className="flex cursor-pointer flex-col gap-1.5 rounded-[20px] border-0 bg-tm-surface px-3.5 py-3 text-left text-tm-ink shadow-tm-card hover:bg-tm-surface/70 focus-visible:shadow-tm-ring focus-visible:outline-none"
              >
                <span className="flex items-center gap-2">
                  <span className="min-w-0 grow truncate text-[13.5px] font-semibold">{m.site}</span>
                  <span className="text-[12px] text-tm-muted tabular-nums">{durationLabel(m.seconds)}</span>
                </span>
                <span className="text-[12px] text-tm-muted">{timeLabel(m.at)} · {speakersLabel(m.speakers)}</span>
                <span className="w-full truncate text-[13px] text-tm-secondary">{m.last}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex h-12 shrink-0 items-center gap-2 px-5 pb-2">
        {undo ? (
          <>
            <Text variant="groupLabel" tone="secondary" className="grow font-normal">{undo.label}</Text>
            <PillButton variant="ghost" size="sm" onPress={undo.onUndo}>Undo</PillButton>
          </>
        ) : (
          <>
            <Text variant="groupLabel" tone="secondary" className="grow font-normal">Text only — audio is never kept</Text>
            {hasSaved && (
              <PillButton variant="ghost" size="sm" className="text-tm-danger-ink! hover:bg-tm-danger-soft!" onPress={onClearAll}>
                Clear all
              </PillButton>
            )}
          </>
        )}
      </div>
    </>
  );
}
