import { IconButton, Kbd, PillButton } from '../../../components/buttons';
import { GrammarPanel, type GrammarView } from '../../../components/GrammarPanel';
import { Recording } from '../../../components/Recording';
import { BrandMark, Flag, Icon } from '../../../components/icons';
import { LanguageCard, StatusChip, Switch, TextAreaCard } from '../../../components/inputs';
import { Text, Wordmark } from '../../../components/typography';
import { findLanguage, languageName } from '../../../core/languages';
import { pairLabel, type HistoryEntry, type Pair } from '../../../settings/history';
import { HistoryRow } from './entries';

export interface HomeProps {
  /** The tab's hostname and whether the widget runs there; null on a non-web page. */
  site: { host: string; on: boolean } | null;
  onToggleSite(on: boolean): void;
  onOpenHistory(): void;
  onOpenSettings(): void;

  /** Source language: picked by the user, detected, or undefined while unknown. */
  from?: string;
  fromDetected: boolean;
  into: string;
  /** The most used pairs; shown as chips above the selects once there are two. */
  pairs: readonly Pair[];
  onPair(pair: Pair): void;
  onPick(side: 'from' | 'into'): void;
  onSwap(): void;
  text: string;
  onTextChange(text: string): void;
  onTranslate(): void;
  /** Voice input: the mic on the text card, then the listening / transcribing card. */
  /** `finishing`: stopped, the live text already in the input; no card, the mic stays off. */
  dictation: 'idle' | 'listening' | 'transcribing' | 'finishing';
  /** While listening: the mic's loudness (0..1), the time so far and the words heard so far. */
  dictationLevel: number;
  dictationSeconds: number;
  dictationText?: string;
  onDictate(): void;
  onStopDictation(): void;
  onCancelDictation(): void;
  /** The grammar fix of the text (dictated English), the same panel as the in-page widget's. */
  grammar: GrammarView | null;
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
  /** The newest history entry, for the "Recent" row. */
  recent?: HistoryEntry;
  onRestore(entry: HistoryEntry): void;
}

export function Home(props: HomeProps) {
  const { site, from, into, result, version, busy, recent } = props;
  const shown = result?.versions[version];
  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-2.5 pl-4 pr-3">
        <BrandMark size={32} />
        <span className="flex min-w-0 grow flex-col gap-px">
          <Wordmark size={15} />
          {site && (
            <Text variant="meta" className="flex min-w-0 items-center gap-1.5 text-[12px]">
              <span
                role="img"
                aria-label={site.on ? 'On' : 'Off'}
                className={`size-2 shrink-0 rounded-full ${site.on ? 'bg-tm-success' : 'bg-tm-danger-ink'}`}
              />
              <span className="truncate">{site.host}</span>
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
        {props.pairs.length >= 2 && (
          <div className="flex gap-1.5" role="group" aria-label="Your usual pairs">
            {props.pairs.map((pair) => {
              const active = pair.from === from && pair.to === into;
              const label = pairLabel(pair);
              return (
                <button key={label} type="button" aria-pressed={active} onClick={() => props.onPair(pair)} className="cursor-pointer rounded-2xl outline-none focus-visible:shadow-tm-ring">
                  <StatusChip tone={active ? 'accent' : 'neutral'}>{label}</StatusChip>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <LanguageCard
            flag={from ? <Flag lang={from} /> : <Icon name="search" size={16} className="text-tm-muted" />}
            caption={from ? (props.fromDetected ? 'Detected' : 'From') : 'From'}
            name={from ? languageName(from) : 'Detect language'}
            onPress={() => props.onPick('from')}
          />
          <IconButton aria-label="Swap languages" size={36} className="shrink-0" isDisabled={!from} onPress={props.onSwap}>
            <Icon name="swap" size={16} strokeWidth={1.9} />
          </IconButton>
          <LanguageCard flag={<Flag lang={into} />} caption="Into" name={languageName(into)} onPress={() => props.onPick('into')} />
        </div>

        <div className="relative flex flex-col">
          <TextAreaCard
            label="Text to translate"
            rows={3}
            lang={from}
            autoFocus
            placeholder="Type, paste or dictate text"
            value={props.text}
            onChange={(event) => props.onTextChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                props.onTranslate();
              }
            }}
          />
          <IconButton aria-label="Voice input" tone="ghost" size={28} className="absolute right-1.5 top-1.5" isDisabled={props.dictation !== 'idle'} onPress={props.onDictate}>
            <Icon name="mic" size={15} strokeWidth={1.9} />
          </IconButton>
        </div>

        {(props.dictation === 'listening' || props.dictation === 'transcribing') && (
          <div className="rounded-3xl bg-tm-surface p-1.5 shadow-tm-card" role="dialog" aria-label="Voice input">
            <Recording transcribing={props.dictation === 'transcribing'} level={props.dictationLevel} seconds={props.dictationSeconds} text={props.dictationText} onStop={props.onStopDictation} onCancel={props.onCancelDictation} />
          </div>
        )}

        {props.grammar && (
          <div className="rounded-3xl bg-tm-surface p-1.5 shadow-tm-card" role="dialog" aria-label="Grammar fixed">
            <GrammarPanel view={props.grammar} />
          </div>
        )}

        <PillButton variant="primary" className="w-full shrink-0" isDisabled={busy || !props.text.trim()} onPress={props.onTranslate}>
          {busy ? `${findLanguage(into)?.translating ?? 'Translating'}…` : `Translate to ${languageName(into)}`}
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
              <StatusChip>{languageName(result.lang)}</StatusChip>
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

        {recent && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between px-1">
              <Text variant="groupLabel" tone="secondary">Recent</Text>
              <button type="button" onClick={props.onOpenHistory} className="cursor-pointer tm-group-label text-tm-ink underline decoration-tm-ink/30 underline-offset-[3px]">
                All history
              </button>
            </div>
            <HistoryRow entry={recent} onPress={() => props.onRestore(recent)} />
          </div>
        )}
      </div>
    </>
  );
}
