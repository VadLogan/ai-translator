import { useState } from 'react';
import { IconButton, PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { SearchField, Segmented } from '../../../components/inputs';
import { SubHeader } from '../../../components/list';
import { Text } from '../../../components/typography';
import { byDay, HISTORY_LIMIT, pairLabel, topPairs, type HistoryEntry } from '../../../settings/history';
import { HistoryCard, type EntryActions } from './entries';
import { Meetings, type MeetingsProps } from './Meetings';

export interface HistoryProps extends EntryActions {
  history: readonly HistoryEntry[];
  onBack(): void;
  onClearAll(): void;
  /** Set right after a delete or clear: what was removed, until undone or superseded. */
  undo: { label: string; onUndo(): void } | null;
  /** The Meetings tab; `hasSaved` is derived here. */
  meetings: Omit<MeetingsProps, 'hasSaved'>;
  /** Kept by the container, so coming back from a meeting lands on Meetings again; without it, History keeps its own. */
  tab?: 'texts' | 'meetings';
  onTab?(tab: 'texts' | 'meetings'): void;
}

export function History({ history, onBack, onClearAll, undo, meetings, tab: shownTab, onTab, ...actions }: HistoryProps) {
  const [ownTab, setOwnTab] = useState<'texts' | 'meetings'>('texts');
  const tab = shownTab ?? ownTab;
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
  const shownMeetings = meetings.meetings.filter((m) => !q || m.site.toLowerCase().includes(q) || m.last.toLowerCase().includes(q));
  return (
    <>
      <SubHeader
        title="History"
        onBack={onBack}
        action={
          <IconButton aria-label={tab === 'texts' ? 'Search history' : 'Search meetings'} tone={searching ? 'accent' : 'ghost'} size={36} onPress={() => (setSearching(!searching), setQuery(''))}>
            <Icon name="search" size={17} strokeWidth={2} />
          </IconButton>
        }
      />
      <div className="flex shrink-0 flex-col gap-2 px-4 pb-3">
        {searching && (
          <SearchField aria-label={tab === 'texts' ? 'Search history' : 'Search meetings'} autoFocus placeholder={tab === 'texts' ? 'Search your translations' : 'Search your meetings'} value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
        )}
        <Segmented
          aria-label="History"
          fill
          value={tab}
          onChange={onTab ?? setOwnTab}
          options={[{ value: 'texts', label: 'Texts' }, { value: 'meetings', label: 'Meetings' }]}
        />
        {tab === 'texts' && (
          <Segmented
            aria-label="Filter history"
            fill
            value={filter}
            onChange={setFilter}
            options={[{ value: 'all', label: 'All' }, ...pairs.map((pair) => ({ value: pair, label: pair })), { value: 'starred', label: 'Starred' }]}
          />
        )}
      </div>
      {tab === 'meetings' ? (
        <Meetings {...meetings} meetings={shownMeetings} hasSaved={meetings.meetings.length > 0} />
      ) : (
        <>
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
      )}
    </>
  );
}
