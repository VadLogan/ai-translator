import { IconButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { StatusChip } from '../../../components/inputs';
import { Text } from '../../../components/typography';
import { pairLabel, type HistoryEntry, type TranslationEntry } from '../../../settings/history';

/** What a history card can do with its entry. */
export interface EntryActions {
  /** Opens the entry on Home. */
  onRestore(entry: HistoryEntry): void;
  onToggleStar(entry: HistoryEntry): void;
  onCopyEntry(entry: HistoryEntry): void;
  /** Opens the entry on Home and asks for another translation. */
  onRetryEntry(entry: TranslationEntry): void;
  onDelete(entry: HistoryEntry): void;
}

/** What made the entry, at a glance: a translation or a grammar fix / rewrite, then a mic when it was dictated. */
function KindIcon({ entry }: { entry: HistoryEntry }) {
  const kind = entry.kind === 'grammar' ? 'Grammar fix' : 'Translation';
  return (
    <span role="img" aria-label={entry.voice ? `${kind} by voice` : kind} className="flex shrink-0 items-center gap-0.5 text-tm-muted">
      <Icon name={entry.kind === 'grammar' ? 'fixGrammar' : 'translate'} size={16} strokeWidth={1.9} />
      {entry.voice && <Icon name="mic" size={13} strokeWidth={2} className="text-tm-accent" />}
    </span>
  );
}

const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const where = (entry: HistoryEntry) => [entry.site, time(entry.at)].filter(Boolean).join(' · ');

/** Home's "Recent": one line, opens the entry. */
export function HistoryRow({ entry, onPress }: { entry: HistoryEntry; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex h-[52px] w-full cursor-pointer items-center gap-2.5 rounded-2xl bg-tm-surface px-3 text-left shadow-tm-card outline-none focus-visible:shadow-tm-ring"
    >
      <KindIcon entry={entry} />
      <span className="flex min-w-0 grow flex-col gap-px">
        <span className="truncate text-[13px]">{entry.text}</span>
        <Text variant="meta">{where(entry)}</Text>
      </span>
      <span className="shrink-0 rounded-2xl bg-tm-subtle px-2 py-0.5 tm-group-label">
        {pairLabel(entry)}
      </span>
    </button>
  );
}

export function HistoryCard({ entry, actions: { onRestore, onToggleStar, onCopyEntry, onRetryEntry, onDelete } }: { entry: HistoryEntry; actions: EntryActions }) {
  return (
    <article className="flex flex-col gap-1.5 rounded-[20px] bg-tm-surface py-3 pl-3.5 pr-3 shadow-tm-card">
      <div className="flex items-center gap-1.5">
        <KindIcon entry={entry} />
        <StatusChip>{pairLabel(entry)}</StatusChip>
        <Text variant="meta" className="min-w-0 grow truncate text-[12px]">{where(entry)}</Text>
        <IconButton aria-label="Star" aria-pressed={!!entry.starred} tone={entry.starred ? 'accent' : 'ghost'} size={28} onPress={() => onToggleStar(entry)}>
          <Icon name="star" size={14} strokeWidth={1.9} className={entry.starred ? '[&_path]:fill-current' : undefined} />
        </IconButton>
        {entry.kind !== 'grammar' && (
          <IconButton aria-label="Translate this again" tone="ghost" size={28} onPress={() => onRetryEntry(entry)}>
            <Icon name="retry" size={14} strokeWidth={2} />
          </IconButton>
        )}
        <IconButton aria-label="Copy this translation" tone="ghost" size={28} onPress={() => onCopyEntry(entry)}>
          <Icon name="copy" size={14} strokeWidth={1.9} />
        </IconButton>
        <IconButton aria-label="Delete from history" tone="ghost" size={28} onPress={() => onDelete(entry)}>
          <Icon name="trash" size={14} strokeWidth={1.9} />
        </IconButton>
      </div>
      <button type="button" onClick={() => onRestore(entry)} className="flex cursor-pointer flex-col gap-1.5 rounded-lg text-left outline-none focus-visible:shadow-tm-ring">
        <span lang={entry.kind === 'grammar' ? undefined : entry.from} className="w-full truncate text-[12.5px] text-tm-muted">{entry.text}</span>
        <span lang={entry.kind === 'grammar' ? undefined : entry.to} className="text-[14px] leading-[1.45]">{entry.result}</span>
      </button>
    </article>
  );
}
