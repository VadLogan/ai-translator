import { useState } from 'react';
import { PillButton } from '../../components/buttons';
import { Flag, Icon } from '../../components/icons';
import { SearchField } from '../../components/inputs';
import { nativeName, searchLanguages } from '../../core/languages';

/** The dashed "Add a language" button; pressed, a search with the first matches as buttons. ↵ adds the first, Esc closes. */
export function AddLanguage({ exclude, onAdd }: { exclude: readonly string[]; onAdd(code: string): void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  if (!open) {
    return (
      <PillButton variant="dashed" size="sm" className="gap-1.5" onPress={() => setOpen(true)}>
        <Icon name="add" size={14} strokeWidth={2.2} />
        Add a language
      </PillButton>
    );
  }

  const matches = searchLanguages(query).filter(({ code }) => !exclude.includes(code)).slice(0, 8);
  const close = () => {
    setOpen(false);
    setQuery('');
  };
  const add = (code: string) => {
    onAdd(code);
    close();
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <SearchField
        aria-label="Search languages"
        autoFocus
        placeholder="Type a language"
        className="w-full max-w-sm"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close();
          if (event.key === 'Enter' && matches[0]) add(matches[0].code);
        }}
      />
      <div className="flex flex-wrap gap-2">
        {matches.map(({ code }) => (
          <PillButton key={code} size="sm" onPress={() => add(code)}>
            <Flag lang={code} width={18} />
            <span lang={code}>{nativeName(code)}</span>
          </PillButton>
        ))}
        <PillButton variant="ghost" size="sm" onPress={close}>Cancel</PillButton>
      </div>
    </div>
  );
}
