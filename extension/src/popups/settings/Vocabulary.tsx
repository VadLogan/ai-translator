import { useState, type FormEvent } from 'react';
import { IconButton, PillButton } from '../../components/buttons';
import { Icon } from '../../components/icons';
import { SearchField, Segmented, Select, TextField } from '../../components/inputs';
import { Text } from '../../components/typography';
import { nativeName } from '../../core/languages';
import { dayLabel } from '../../settings/history';
import { EXCEPTION_KINDS, type VocabException, type VocabWord } from '../../settings/vocabulary';

export interface VocabularyProps {
  words: readonly VocabWord[];
  exceptions: readonly VocabException[];
  onRemoveWord(word: VocabWord): void;
  onListen(word: VocabWord): void;
  onAddException(entry: VocabException): void;
  onRemoveException(term: string): void;
}

/** The Vocabulary section's body: Learning (words with where they were met) and Exceptions (kept as written). */
export function Vocabulary(props: VocabularyProps) {
  const [view, setView] = useState<'learning' | 'exceptions'>('learning');
  return (
    <div className="flex flex-col gap-3 pb-3 pt-2">
      <span className="self-start">
        <Segmented
          aria-label="Vocabulary lists"
          value={view}
          onChange={setView}
          options={[
            { value: 'learning', label: `Learning · ${props.words.length}` },
            { value: 'exceptions', label: `Exceptions · ${props.exceptions.length}` },
          ]}
        />
      </span>
      {view === 'learning' ? <Learning {...props} /> : <Exceptions {...props} />}
    </div>
  );
}

function Learning({ words, onRemoveWord, onListen }: VocabularyProps) {
  const [lang, setLang] = useState('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<VocabWord | null>(null);

  const langs = [...new Set(words.map((w) => w.lang))];
  const q = query.trim().toLowerCase();
  const shown = words.filter(
    (w) => (lang === 'all' || w.lang === lang) && (!q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)),
  );
  const count = (code: string) => words.filter((w) => code === 'all' || w.lang === code).length;

  if (words.length === 0) {
    return <Text variant="body" tone="muted" className="py-2">No words yet. Words you add while translating show up here.</Text>;
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {langs.length > 1 && (
          <Segmented
            aria-label="Language"
            value={lang}
            onChange={setLang}
            options={['all', ...langs].map((code) => ({ value: code, label: `${code === 'all' ? 'All' : nativeName(code)} · ${count(code)}` }))}
          />
        )}
        <span className="grow" />
        <SearchField aria-label="Search vocabulary" placeholder="Search words" className="w-60" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="flex flex-col">
        {shown.map((w) => {
          const expanded = open === w;
          return (
            <article key={`${w.lang}|${w.word}`} className="border-t border-tm-line">
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : w)}
                  className="flex min-h-[52px] w-full cursor-pointer items-center gap-3 rounded-xl px-1 py-2 text-left outline-none focus-visible:shadow-tm-ring"
                >
                  <span lang={w.lang} className="text-[16px] font-bold tracking-[-0.01em]">{w.word}</span>
                  <span className="rounded-lg bg-tm-soft px-[7px] py-0.5 text-[11.5px] font-semibold uppercase text-tm-accent-text">{w.lang}</span>
                  <span className="grow tm-body text-tm-secondary">{w.meaning}</span>
                  <span className="text-[12px] text-tm-placeholder">{dayLabel(w.at)}</span>
                  <Icon name="chevronDown" size={16} strokeWidth={2} className={`text-tm-muted ${expanded ? 'rotate-180' : ''}`} />
                </button>
              </h3>
              {expanded && (
                <div className="flex flex-col gap-2.5 px-1 pb-4">
                  <div className="flex flex-col gap-1 rounded-[14px] bg-tm-soft/50 px-3 py-2.5">
                    <span className="text-[12px] font-medium text-tm-accent-text">Where you met it · {w.source}</span>
                    <span lang={w.lang} className="text-[14px] leading-[1.55]"><Highlighted text={w.context} hit={w.hit} /></span>
                  </div>
                  {w.examples.length > 0 && <span className="px-0.5 text-[12px] font-medium text-tm-muted">More examples</span>}
                  {w.examples.map((example) => (
                    <span key={example} lang={w.lang} className="border-l-2 border-tm-line pl-3 text-[14px] leading-normal">{example}</span>
                  ))}
                  <span className="flex gap-1.5 pt-0.5">
                    <PillButton size="sm" className="gap-1.5" onPress={() => onListen(w)}>
                      <Icon name="listen" size={14} />
                      Listen
                    </PillButton>
                    <PillButton variant="ghost" size="sm" className="text-tm-muted" onPress={() => onRemoveWord(w)}>Remove</PillButton>
                  </span>
                </div>
              )}
            </article>
          );
        })}
        {shown.length === 0 && <Text variant="body" tone="muted" className="border-t border-tm-line py-3">Nothing matches.</Text>}
      </div>
    </>
  );
}

function Highlighted({ text, hit }: { text: string; hit?: string }) {
  const at = hit ? text.indexOf(hit) : -1;
  if (!hit || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded bg-tm-soft px-0.5 font-semibold text-tm-accent-text">{hit}</mark>
      {text.slice(at + hit.length)}
    </>
  );
}

const GRID = 'grid grid-cols-[200px_90px_minmax(0,1fr)_32px] items-center gap-3';

function Exceptions({ exceptions, onAddException, onRemoveException }: VocabularyProps) {
  const [term, setTerm] = useState('');
  const [kind, setKind] = useState<VocabException['kind']>('Brand');
  const [replaces, setReplaces] = useState('');

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!term.trim()) return;
    onAddException({ term: term.trim(), kind, replaces: replaces.split(',').map((s) => s.trim()).filter(Boolean) });
    setTerm('');
    setReplaces('');
  };
  return (
    <>
      <form onSubmit={add} className="flex flex-wrap items-end gap-2.5 rounded-2xl bg-tm-subtle px-3.5 py-3">
        <TextField label="Word or name" placeholder="e.g. TypeMeant" className="min-w-40 flex-[2] [&_input]:bg-tm-surface" value={term} onChange={(event) => setTerm(event.target.value)} />
        <span className="inline-flex w-[130px] flex-col gap-1.5">
          <label htmlFor="exception-kind" className="tm-group-label text-tm-muted">Kind</label>
          <Select id="exception-kind" className="[&_select]:bg-tm-surface" value={kind} onChange={(event) => setKind(event.target.value as VocabException['kind'])}>
            {EXCEPTION_KINDS.map((k) => <option key={k}>{k}</option>)}
          </Select>
        </span>
        <TextField label="Replaces (optional)" placeholder="e.g. type meant, Typemeant" className="min-w-40 flex-[2] [&_input]:bg-tm-surface" value={replaces} onChange={(event) => setReplaces(event.target.value)} />
        <PillButton type="submit" variant="primary" size="md" isDisabled={!term.trim()}>Add</PillButton>
      </form>
      {exceptions.length > 0 && (
        <div className="overflow-x-auto">
          <div className={`${GRID} px-1 pt-1 text-[12px] font-medium text-tm-muted`}>
            <span>Word</span><span>Kind</span><span>Replaces</span><span />
          </div>
          {exceptions.map((x) => (
            <div key={x.term} className={`${GRID} min-h-14 border-t border-tm-line px-1 py-2`}>
              <span className="truncate text-[15px] font-bold tracking-[-0.01em]">{x.term}</span>
              <span className="text-[12px] font-medium text-tm-secondary">{x.kind}</span>
              <span className="truncate text-[13px] text-tm-muted">{x.replaces.join(', ') || '—'}</span>
              <IconButton aria-label={`Remove ${x.term}`} tone="ghost" onPress={() => onRemoveException(x.term)}>
                <Icon name="close" size={14} strokeWidth={2.2} />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      <Text variant="helper" tone="muted" className="px-1">
        Exceptions are never translated, never marked as mistakes, and any form under Replaces is written the way you saved it — in every language.
      </Text>
    </>
  );
}
