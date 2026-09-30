import { useState } from 'react';
import { LANGUAGES } from '../../../../../shared/contants';
import { Kbd } from '../../../components/buttons';
import { Flag, Icon } from '../../../components/icons';
import { SearchField } from '../../../components/inputs';
import { Group, Row, SubHeader } from '../../../components/list';
import { Text } from '../../../components/typography';
import { languageName, nativeName, searchLanguages } from '../../../core/languages';

export interface LanguagesProps {
  side: 'from' | 'into';
  /** The language picked on this side now; undefined on the from side = "Detect automatically". */
  current?: string;
  /** "Yours", numbered for the digit keys. */
  yours: readonly string[];
  lately: readonly { code: string; at: number }[];
  /** Pinned languages: always first in "Yours". */
  pinned: readonly string[];
  onTogglePin(code: string): void;
  onBack(): void;
  /** null = "Detect automatically" (source only). */
  onChoose(code: string | null): void;
}

export function Languages({ side, current, yours, lately, pinned, onTogglePin, onBack, onChoose }: LanguagesProps) {
  const [query, setQuery] = useState('');
  const [browse, setBrowse] = useState(false);
  const listing = query.trim() || browse;
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
              <LanguageRow key={lang} lang={lang} selected={lang === current} pinned={pinned.includes(lang)} onTogglePin={() => onTogglePin(lang)} onPress={() => onChoose(lang)} />
            ))}
          </Group>
        ) : (
          <>
            {side === 'from' && (
              <Group label="Automatic">
                <Row selected={current === undefined} onPress={() => onChoose(null)} icon={<Icon name="search" size={16} className="text-tm-muted" />}>
                  <span className="grow tm-label">Detect automatically</span>
                </Row>
              </Group>
            )}
            {yours.length > 0 && (
              <Group label="Yours">
                {yours.map((lang, index) => (
                  <LanguageRow key={lang} lang={lang} selected={lang === current} hint={String(index + 1)} pinned={pinned.includes(lang)} onTogglePin={() => onTogglePin(lang)} onPress={() => onChoose(lang)} />
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

function LanguageRow({ lang, selected, hint, pinned, onTogglePin, onPress }: { lang: string; selected: boolean; hint?: string; pinned: boolean; onTogglePin: () => void; onPress: () => void }) {
  const pin = (
    <button
      type="button"
      aria-label={pinned ? `Unpin ${languageName(lang)}` : `Pin ${languageName(lang)}`}
      aria-pressed={pinned}
      title={pinned ? 'Unpin' : 'Pin to the top'}
      onClick={onTogglePin}
      className={`flex size-8 cursor-pointer items-center justify-center rounded-full outline-none hover:bg-tm-neutral focus-visible:opacity-100 focus-visible:shadow-tm-ring ${pinned ? 'text-tm-accent' : 'text-tm-muted opacity-0 group-hover:opacity-100'}`}
    >
      <Icon name="pin" size={15} className={pinned ? '[&_path]:fill-current' : undefined} />
    </button>
  );
  return (
    <Row selected={selected} onPress={onPress} icon={<Flag lang={lang} width={22} />} action={pin}>
      <span className="flex grow flex-col">
        <span lang={lang} className="tm-label">{nativeName(lang)}</span>
        <Text variant="meta" className="text-[12px]">{languageName(lang)} · {lang}</Text>
      </span>
      {selected && <Icon name="check" size={16} strokeWidth={2.4} className="text-tm-accent" />}
      {hint && <Kbd tone="row">{hint}</Kbd>}
    </Row>
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
