import { useState, type ReactNode } from 'react';
import { findLanguage, LANGUAGES, nativeName, searchLanguages } from '../../core/languages';
import { byDay, HISTORY_LIMIT, pairLabel, topPairs, type HistoryEntry } from '../../settings/history';
import { IconButton, Kbd, PillButton } from '../../ui/buttons';
import { Flag, BrandMark, Icon } from '../../ui/icons';
import { LanguageCard, SearchField, Segmented, StatusChip, Switch, TextAreaCard } from '../../ui/inputs';
import { Text, Wordmark } from '../../ui/typography';

export type PopupScreen = 'home' | 'history' | { pick: 'from' | 'into' };

export interface PopupProps {
  screen: PopupScreen;
  /** The tab's hostname and whether the widget runs there; null on a non-web page. */
  site: { host: string; on: boolean } | null;
  onToggleSite(on: boolean): void;
  onOpenHistory(): void;
  onOpenSettings(): void;
  onBack(): void;

  /** Source language: picked by the user, detected, or undefined while unknown. */
  from?: string;
  fromDetected: boolean;
  into: string;
  onPick(side: 'from' | 'into'): void;
  onSwap(): void;
  text: string;
  onTextChange(text: string): void;
  onTranslate(): void;
  busy: boolean;
  /** The translation and its alternatives ("Try another"), in the language it was made into. */
  result: { lang: string; versions: readonly string[] } | null;
  version: number;
  onVersion(index: number): void;
  onRetry(): void;
  onCopy(): void;
  onInsert(): void;
  notice: { message: string; isError: boolean } | null;
  /** Shown instead of the notice when the API answered 401. */
  providers: readonly { id: string; name: string }[] | null;
  onSignIn(providerId: string): void;

  history: readonly HistoryEntry[];
  /** Opens the entry on Home. */
  onRestore(entry: HistoryEntry): void;
  /** undefined clears the rating. */
  onRate(entry: HistoryEntry, rating: HistoryEntry['rating']): void;
  onCopyEntry(entry: HistoryEntry): void;
  /** Opens the entry on Home and asks for another translation. */
  onRetryEntry(entry: HistoryEntry): void;
  onDelete(entry: HistoryEntry): void;
  onClearAll(): void;
  /** Set right after a delete or clear: what was removed, until undone or superseded. */
  undo: { label: string; onUndo(): void } | null;

  favorites: readonly string[];
  lately: readonly { code: string; at: number }[];
  /** null = "Detect automatically" (source only). */
  onChoose(code: string | null): void;
}

export function Popup(props: PopupProps) {
  return (
    <div className="flex max-h-[600px] w-[400px] flex-col bg-tm-subtle font-tm text-tm-ink">
      {props.screen === 'home' ? (
        <Home {...props} />
      ) : props.screen === 'history' ? (
        <History {...props} />
      ) : (
        <Languages {...props} side={props.screen.pick} />
      )}
    </div>
  );
}

const nameOf = (lang: string) => findLanguage(lang)?.name ?? lang;
const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function Home(props: PopupProps) {
  const { site, from, into, result, version, busy } = props;
  const shown = result?.versions[version];
  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-2.5 pl-4 pr-3">
        <BrandMark size={32} />
        <span className="flex min-w-0 grow flex-col gap-px">
          <Wordmark size={15} />
          {site && (
            <Text variant="meta" className="truncate text-[12px]">
              {site.on ? 'On' : 'Off'} for {site.host}
            </Text>
          )}
        </span>
        {site && (
          <Switch
            aria-label={`AI Translator on ${site.host}`}
            checked={site.on}
            onChange={(event) => props.onToggleSite(event.currentTarget.checked)}
            className="mr-1"
          />
        )}
        <IconButton aria-label="Translation history" tone="ghost" size={36} onPress={props.onOpenHistory}>
          <Icon name="history" size={18} />
        </IconButton>
        <IconButton aria-label="Settings" tone="ghost" size={36} onPress={props.onOpenSettings}>
          <Icon name="settings" size={18} />
        </IconButton>
      </header>

      <div className="flex min-h-0 grow flex-col gap-3 overflow-y-auto px-4 pb-4 pt-1">
        <div className="flex items-center gap-1.5">
          <LanguageCard
            flag={from ? <Flag lang={from} /> : <Icon name="search" size={16} className="text-tm-muted" />}
            caption={from ? (props.fromDetected ? 'Detected' : 'From') : 'From'}
            name={from ? nameOf(from) : 'Detect language'}
            onPress={() => props.onPick('from')}
          />
          <IconButton aria-label="Swap languages" size={36} className="shrink-0" isDisabled={!from} onPress={props.onSwap}>
            <Icon name="swap" size={16} strokeWidth={1.9} />
          </IconButton>
          <LanguageCard flag={<Flag lang={into} />} caption="Into" name={nameOf(into)} onPress={() => props.onPick('into')} />
        </div>

        <TextAreaCard
          label="Text to translate"
          rows={3}
          lang={from}
          autoFocus
          placeholder="Type or paste text"
          value={props.text}
          onChange={(event) => props.onTextChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              props.onTranslate();
            }
          }}
        />

        <PillButton variant="primary" className="w-full shrink-0" isDisabled={busy || !props.text.trim()} onPress={props.onTranslate}>
          {busy ? `${findLanguage(into)?.translating ?? 'Translating'}…` : `Translate to ${nameOf(into)}`}
          {!busy && <Kbd tone="onAccent">⌘ ↵</Kbd>}
        </PillButton>

        {props.providers ? (
          <div className="flex flex-col gap-2 rounded-3xl bg-tm-surface px-4 py-3.5 shadow-tm-card">
            <Text variant="label">Sign in to translate</Text>
            <div className="flex flex-wrap gap-2">
              {props.providers.map((provider) => (
                <PillButton key={provider.id} size="sm" onPress={() => props.onSignIn(provider.id)}>
                  {provider.name}
                </PillButton>
              ))}
            </div>
          </div>
        ) : (
          props.notice && (
            <Text variant="helper" tone={props.notice.isError ? undefined : 'muted'} className={`px-1 ${props.notice.isError ? 'text-tm-danger-ink' : ''}`}>
              {props.notice.message}
            </Text>
          )
        )}

        {result && shown !== undefined && (
          <div className="flex flex-col gap-2.5 rounded-3xl bg-tm-surface px-4 pb-4 pt-3.5 shadow-tm-card">
            <div className="flex items-center gap-1.5">
              <StatusChip>{nameOf(result.lang)}</StatusChip>
              <Text variant="meta" className="grow text-[12px]">
                {result.versions.length > 1 && `Version ${version + 1} of ${result.versions.length}`}
              </Text>
              {result.versions.length > 1 && (
                <>
                  <IconButton aria-label="Previous version" tone="ghost" size={28} isDisabled={version === 0} onPress={() => props.onVersion(version - 1)}>
                    <Icon name="back" size={15} strokeWidth={2} />
                  </IconButton>
                  <IconButton aria-label="Next version" tone="ghost" size={28} isDisabled={version === result.versions.length - 1} onPress={() => props.onVersion(version + 1)}>
                    <Icon name="forward" size={15} strokeWidth={2} />
                  </IconButton>
                </>
              )}
            </div>
            <p lang={result.lang} className="m-0 whitespace-pre-wrap tm-body">{shown}</p>
            <div className="flex items-center gap-1.5">
              <PillButton variant="ghost" size="sm" isDisabled={busy} onPress={props.onRetry}>
                <Icon name="retry" size={14} strokeWidth={2} />
                Try another
              </PillButton>
              <span className="grow" />
              <PillButton size="sm" onPress={props.onCopy}>
                <Icon name="copy" size={14} strokeWidth={1.9} />
                Copy
              </PillButton>
              <IconButton aria-label="Insert into the focused field on the page" onPress={props.onInsert}>
                <Icon name="insert" size={15} strokeWidth={1.9} />
              </IconButton>
            </div>
          </div>
        )}

        {props.history[0] && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between px-1">
              <Text variant="groupLabel" tone="secondary">Recent</Text>
              <button type="button" onClick={props.onOpenHistory} className="cursor-pointer tm-group-label text-tm-ink underline decoration-tm-ink/30 underline-offset-[3px]">
                All history
              </button>
            </div>
            <HistoryRow entry={props.history[0]} onPress={() => props.onRestore(props.history[0]!)} />
          </div>
        )}
      </div>
    </>
  );
}

function HistoryRow({ entry, onPress }: { entry: HistoryEntry; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex h-[52px] w-full cursor-pointer items-center gap-2.5 rounded-2xl bg-tm-surface px-3 text-left shadow-tm-card outline-none focus-visible:shadow-tm-ring"
    >
      <span className="flex min-w-0 grow flex-col gap-px">
        <span className="truncate text-[13px]">{entry.text}</span>
        <Text variant="meta">{[entry.site, time(entry.at)].filter(Boolean).join(' · ')}</Text>
      </span>
      <span className="shrink-0 rounded-2xl bg-tm-subtle px-2 py-0.5 tm-group-label">
        {pairLabel(entry)}
      </span>
    </button>
  );
}

function SubHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return (
    <header className="flex h-[60px] shrink-0 items-center gap-1.5 px-2.5">
      <IconButton aria-label="Back" tone="ghost" size={36} className="text-tm-ink" onPress={onBack}>
        <Icon name="arrowBack" size={18} strokeWidth={1.9} />
      </IconButton>
      <Text variant="sectionTitle" className="grow">{title}</Text>
      {action}
    </header>
  );
}

function History(props: PopupProps) {
  const { history, onBack, undo } = props;
  const [filter, setFilter] = useState('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const pairs = topPairs(history);
  const q = query.trim().toLowerCase();
  const shown = history.filter(
    (entry) =>
      (filter === 'all' || (filter === 'liked' ? entry.rating === 'good' : pairLabel(entry) === filter)) &&
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
          options={[{ value: 'all', label: 'All' }, ...pairs.map((pair) => ({ value: pair, label: pair })), { value: 'liked', label: 'Liked' }]}
        />
      </div>
      <div className="flex min-h-0 grow flex-col gap-2 overflow-y-auto px-4 pb-3.5">
        {shown.length === 0 && (
          <Text variant="helper" className="px-1">{history.length ? 'Nothing matches.' : 'Nothing translated here yet.'}</Text>
        )}
        {byDay(shown).map(({ day, entries }, index) => (
          <div key={day} className={`flex flex-col gap-2 ${index ? 'pt-1' : ''}`}>
            <Text variant="groupLabel" tone="secondary" className="px-1">{day}</Text>
            {entries.map((entry) => <HistoryCard key={entry.at} entry={entry} {...props} />)}
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
              <PillButton variant="ghost" size="sm" className="text-tm-danger-ink! hover:bg-tm-danger-soft!" onPress={props.onClearAll}>
                Clear all
              </PillButton>
            )}
          </>
        )}
      </div>
    </>
  );
}

function HistoryCard({ entry, onRestore, onRate, onCopyEntry, onRetryEntry, onDelete }: PopupProps & { entry: HistoryEntry }) {
  const rate = (rating: 'good' | 'bad') => onRate(entry, entry.rating === rating ? undefined : rating);
  return (
    <article className="flex flex-col gap-1.5 rounded-[20px] bg-tm-surface py-3 pl-3.5 pr-3 shadow-tm-card">
      <div className="flex items-center gap-1.5">
        <StatusChip>{pairLabel(entry)}</StatusChip>
        <Text variant="meta" className="min-w-0 grow truncate text-[12px]">{[entry.site, time(entry.at)].filter(Boolean).join(' · ')}</Text>
        <IconButton aria-label="Mark as a good translation" aria-pressed={entry.rating === 'good'} tone={entry.rating === 'good' ? 'accent' : 'ghost'} size={28} onPress={() => rate('good')}>
          <Icon name="like" size={14} strokeWidth={1.9} />
        </IconButton>
        <IconButton aria-label="Mark as a bad translation" aria-pressed={entry.rating === 'bad'} tone={entry.rating === 'bad' ? 'danger' : 'ghost'} size={28} onPress={() => rate('bad')}>
          <Icon name="dislike" size={14} strokeWidth={1.9} />
        </IconButton>
        {/* A bad translation's next step is another try, so it takes the copy slot. */}
        {entry.rating === 'bad' ? (
          <IconButton aria-label="Translate this again" tone="accent" size={28} onPress={() => onRetryEntry(entry)}>
            <Icon name="retry" size={14} strokeWidth={2} />
          </IconButton>
        ) : (
          <IconButton aria-label="Copy this translation" tone="ghost" size={28} onPress={() => onCopyEntry(entry)}>
            <Icon name="copy" size={14} strokeWidth={1.9} />
          </IconButton>
        )}
        <IconButton aria-label="Delete from history" tone="ghost" size={28} onPress={() => onDelete(entry)}>
          <Icon name="trash" size={14} strokeWidth={1.9} />
        </IconButton>
      </div>
      <button type="button" onClick={() => onRestore(entry)} className="flex cursor-pointer flex-col gap-1.5 rounded-lg text-left outline-none focus-visible:shadow-tm-ring">
        <span lang={entry.from} className="w-full truncate text-[12.5px] text-tm-muted">{entry.text}</span>
        <span lang={entry.to} className="text-[14px] leading-[1.45]">{entry.result}</span>
      </button>
    </article>
  );
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function ago(at: number): string {
  const minutes = Math.round((at - Date.now()) / 60_000);
  if (minutes > -60) return relative.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relative.format(hours, 'hour');
  const days = Math.round(hours / 24);
  return days > -7 ? relative.format(days, 'day') : relative.format(Math.round(days / 7), 'week');
}

function Languages({ side, from, into, favorites, lately, onBack, onChoose }: PopupProps & { side: 'from' | 'into' }) {
  const [query, setQuery] = useState('');
  const [browse, setBrowse] = useState(false);
  const current = side === 'into' ? into : from;
  const listing = query.trim() || browse;
  const yours = favorites.slice(0, 9);
  return (
    <>
      <SubHeader title={side === 'into' ? 'Translate into' : 'Translate from'} onBack={onBack} />
      <div className="flex min-h-0 grow flex-col gap-[18px] overflow-y-auto px-4 pb-4 pt-1">
        <SearchField
          aria-label="Search languages"
          autoFocus
          placeholder={`Type a language — ${LANGUAGES.length} available`}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            // With nothing typed, a digit picks from "Yours", as the numbers promise.
            const digit = Number(event.key);
            if (!query && digit >= 1 && yours[digit - 1]) {
              event.preventDefault();
              onChoose(yours[digit - 1]!);
            }
            if (event.key === 'Enter' && query) {
              const first = searchLanguages(query)[0];
              if (first) onChoose(first.code);
            }
          }}
        />

        {listing ? (
          <Group label={query.trim() ? 'Results' : 'All languages'}>
            {searchLanguages(query).map(({ code: lang }) => (
              <LanguageRow key={lang} lang={lang} selected={lang === current} onPress={() => onChoose(lang)} />
            ))}
          </Group>
        ) : (
          <>
            {side === 'from' && (
              <Group label="Automatic">
                <Row selected={from === undefined} onPress={() => onChoose(null)} icon={<Icon name="search" size={16} className="text-tm-muted" />}>
                  <span className="grow tm-label">Detect automatically</span>
                </Row>
              </Group>
            )}
            {yours.length > 0 && (
              <Group label="Yours">
                {yours.map((lang, index) => (
                  <LanguageRow key={lang} lang={lang} selected={lang === current} hint={String(index + 1)} onPress={() => onChoose(lang)} />
                ))}
              </Group>
            )}
            {lately.length > 0 && (
              <Group label="Used lately">
                {lately.map(({ code: lang, at }) => (
                  <Row key={lang} compact selected={lang === current} onPress={() => onChoose(lang)} icon={<Flag lang={lang} width={22} />}>
                    <span lang={lang} className="grow text-[14px]">{nativeName(lang)}</span>
                    <Text variant="meta" className="text-[12px]">{ago(at)}</Text>
                  </Row>
                ))}
              </Group>
            )}
            <span className="grow" />
            <div className="flex shrink-0 items-center gap-2 px-1">
              <Text variant="groupLabel" tone="secondary" className="grow font-normal">Everything else is one search away</Text>
              <button type="button" onClick={() => setBrowse(true)} className="cursor-pointer text-[13px] font-medium text-tm-ink underline decoration-tm-ink/30 underline-offset-[3px]">
                Browse A–Z
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="groupLabel" tone="secondary" className="px-1">{label}</Text>
      <div className="flex flex-col gap-0.5 rounded-3xl bg-tm-surface p-1.5 shadow-tm-card">{children}</div>
    </div>
  );
}

function Row({ selected, compact, icon, onPress, children }: { selected: boolean; compact?: boolean; icon: ReactNode; onPress: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-current={selected || undefined}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left outline-none hover:bg-tm-subtle focus-visible:shadow-tm-ring ${compact ? 'min-h-10' : 'min-h-12'} ${selected ? 'bg-tm-neutral hover:bg-tm-neutral' : ''}`}
    >
      {icon}
      {children}
    </button>
  );
}

function LanguageRow({ lang, selected, hint, onPress }: { lang: string; selected: boolean; hint?: string; onPress: () => void }) {
  return (
    <Row selected={selected} onPress={onPress} icon={<Flag lang={lang} width={22} />}>
      <span className="flex grow flex-col">
        <span lang={lang} className="tm-label">{nativeName(lang)}</span>
        <Text variant="meta" className="text-[12px]">{nameOf(lang)} · {lang}</Text>
      </span>
      {selected && <Icon name="check" size={16} strokeWidth={2.4} className="text-tm-accent" />}
      {hint && <Kbd tone="row">{hint}</Kbd>}
    </Row>
  );
}
