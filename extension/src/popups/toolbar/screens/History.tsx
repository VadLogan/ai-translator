import { useState } from 'react';
import { IconButton, PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { SearchField, Segmented } from '../../../components/inputs';
import { SubHeader } from '../../../components/list';
import { Text } from '../../../components/typography';
import { byDay, HISTORY_LIMIT, pairLabel, topPairs, type HistoryEntry } from '../../../settings/history';
import { HistoryCard, type EntryActions } from './entries';

export interface HistoryProps extends EntryActions {
  history: readonly HistoryEntry[];
  onBack(): void;
  onClearAll(): void;
  /** Set right after a delete or clear: what was removed, until undone or superseded. */
  undo: { label: string; onUndo(): void } | null;
}

export function History({ history, onBack, onClearAll, undo, ...actions }: HistoryProps) {
  const [filter, setFilter] = useState('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const pairs = topPairs(history).map(pairLabel);
  const q = query.trim().toLowerCase();
  const shown = history.filter(
    (entry) =>
      (filter === 'all' || (filter === 'starred' ? entry.starred : pairLabel(entry) === filter)) &&
      (!q || entry.text.toLowerCase().includes(q) || entry.result.toLowerCase().includes(q)),
  );
  return (
    <>
      <SubHeader
        title="History"
        onBack={onBack}
        action={
          <IconButton aria-label="Search history" tone={searching ? 'accent' : 'ghost'} size={36} onPress={() => (setSearching(!searching), setQuery(''))}>
            <Icon name="search" size={17} strokeWidth={2} />
          </IconButton>
        }
      />
      <div className="flex shrink-0 flex-col gap-2 px-4 pb-3">
        {searching && (
          <SearchField aria-label="Search history" autoFocus placeholder="Search your translations" value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
        )}
        <Segmented
          aria-label="Filter history"
          fill
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'All' }, ...pairs.map((pair) => ({ value: pair, label: pair })), { value: 'starred', label: 'Starred' }]}
        />
      </div>
      <div className="flex min-h-0 grow flex-col gap-2 overflow-y-auto px-4 pb-3.5">
        {shown.length === 0 && (
          <Text variant="helper" className="px-1">{history.length ? 'Nothing matches.' : 'Nothing translated here yet.'}</Text>
        )}
        {byDay(shown).map(({ day, entries }, index) => (
          <div key={day} className={`flex flex-col gap-2 ${index ? 'pt-1' : ''}`}>
            <Text variant="groupLabel" tone="secondary" className="px-1">{day}</Text>
            {entries.map((entry) => <HistoryCard key={entry.at} entry={entry} actions={actions} />)}
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
            <Text variant="groupLabel" tone="secondary" className="grow font-normal">Last {HISTORY_LIMIT} kept · deletes can be undone</Text>
            {history.length > 0 && (
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
