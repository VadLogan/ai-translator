import { IconButton, PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { ResultCard, SpeakerLegend, TranscriptLine, type TranscriptCallbacks } from '../../../components/Transcript';
import { Text } from '../../../components/typography';
import type { TranscriptLineView } from '../../../core/transcript';
import type { SummaryState } from '../hooks/useMeetingDetail';

export interface MeetingDetailProps extends TranscriptCallbacks {
  site: string;
  /** "Today 12:21 · 37 min". */
  meta: string;
  speakers: readonly { id: string; name: string; color: string }[];
  /** Null: saved before transcripts were kept. */
  lines: TranscriptLineView[] | null;
  summary: SummaryState;
  /** "Copied", briefly. */
  notice: string | null;
  onBack(): void;
  onCopy(): void;
  onDelete(): void;
  onSummarize(): void;
}

/** One saved meeting: its transcript, with the live card's actions, and its key points. */
export function MeetingDetail({ site, meta, speakers, lines, summary, notice, onBack, onCopy, onDelete, onSummarize, ...transcript }: MeetingDetailProps) {
  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-1.5 px-2.5">
        <IconButton aria-label="Back to meetings" tone="ghost" size={36} className="text-tm-ink" onPress={onBack}>
          <Icon name="arrowBack" size={18} strokeWidth={1.9} />
        </IconButton>
        <span className="flex min-w-0 grow flex-col gap-px">
          <span className="truncate text-[15px] font-semibold">{site}</span>
          <span className="text-[12px] text-tm-muted" aria-live="polite">{notice ?? meta}</span>
        </span>
        {lines && (
          <IconButton aria-label="Copy the whole transcript" tone="ghost" size={36} onPress={onCopy}>
            <Icon name="copy" size={16} strokeWidth={1.9} />
          </IconButton>
        )}
        <IconButton aria-label="Delete this meeting" tone="ghost" size={36} onPress={onDelete}>
          <Icon name="trash" size={16} strokeWidth={1.9} />
        </IconButton>
      </header>
      {speakers.length > 0 && <SpeakerLegend speakers={speakers} className="shrink-0 px-[18px] pb-2.5" />}
      <div className="mx-3 mb-3 flex h-[476px] min-h-0 flex-col overflow-hidden rounded-[20px] bg-tm-surface shadow-tm-card">
        {lines ? (
          <div className="flex min-h-0 grow flex-col overflow-y-auto">
            <div className="flex flex-col gap-0.5 px-1.5 pt-1 pb-1.5">
              <Summary summary={summary} onSummarize={onSummarize} />
              {lines.map((line) => (
                <TranscriptLine key={line.id} line={line} callbacks={transcript} />
              ))}
            </div>
          </div>
        ) : (
          <Text variant="helper" className="px-4 py-6 text-center">No transcript saved for this meeting.</Text>
        )}
      </div>
    </>
  );
}

function Summary({ summary, onSummarize }: { summary: SummaryState; onSummarize(): void }) {
  if (summary.status === 'idle' || summary.status === 'error') {
    return (
      <div className="flex items-center gap-2 px-2.5 pt-1.5 pb-1">
        <PillButton variant="secondary" size="sm" onPress={onSummarize}>
          <Icon name="moreNative" size={14} /> Summarize key points
        </PillButton>
        {summary.status === 'error' && <span className="text-[12px] text-tm-danger-ink">Couldn't summarize. Try again.</span>}
      </div>
    );
  }
  return (
    <div className="px-1 pt-1 pb-1">
      {summary.status === 'loading' ? (
        <ResultCard result={{ kind: 'loading', title: 'Key points' }} />
      ) : (
        <div className="flex flex-col gap-1 rounded-xl border border-tm-line bg-tm-surface px-2.5 py-2">
          <span className="text-[11.5px] font-semibold text-tm-accent-text">Key points</span>
          {summary.points.map((point) => (
            <span key={point} className="rounded-lg bg-tm-subtle px-2 py-1 text-[13px] text-tm-ink">
              {point}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
