import { useState, type FormEvent } from 'react';
import { PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { Segmented, TextField } from '../../../components/inputs';
import { Text } from '../../../components/typography';
import { EXCEPTION_KINDS, type VocabException } from '../../../settings/vocabulary';
import type { WidgetView } from '../view';

/** "Add to Exceptions": the selection prefilled as the word to keep. A different spelling turns the selection into a form it replaces. */
export function ExceptionPanel({ view }: { view: Extract<WidgetView, { kind: 'exception' }> }) {
  const [term, setTerm] = useState(view.selected);
  const [kind, setKind] = useState<VocabException['kind']>('Brand');
  const [fix, setFix] = useState(true);
  const word = term.trim();
  const differs = word !== '' && word !== view.selected;

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (word) view.onSave({ term: word, kind, replaces: differs ? [view.selected] : [] }, differs && view.canFix && fix);
  };
  return (
    <form onSubmit={save} className="flex flex-col gap-3 p-1.5">
      <span className="flex items-center gap-1.5 tm-label">
        <Icon name="shield" size={15} strokeWidth={1.9} />
        Add to Exceptions
      </span>
      <TextField label="Keep this word as-is" autoFocus value={term} onChange={(event) => setTerm(event.target.value)} />
      {differs && (
        <Text variant="helper" tone="muted">
          <span className="text-tm-ink line-through">{view.selected}</span> will be written as <span className="font-semibold text-tm-ink">{word}</span>
        </Text>
      )}
      <span className="flex flex-col gap-1.5">
        <span className="tm-group-label text-tm-muted">Kind</span>
        <Segmented aria-label="Kind" fill value={kind} onChange={setKind} options={EXCEPTION_KINDS.map((k) => ({ value: k, label: k }))} />
      </span>
      {differs && view.canFix && (
        <label className="flex cursor-pointer items-center gap-2 tm-body">
          <input type="checkbox" checked={fix} onChange={(event) => setFix(event.target.checked)} className="size-4 accent-tm-accent" />
          Fix it in this text too
        </label>
      )}
      <span className="flex justify-end gap-1.5">
        <PillButton size="sm" onPress={view.onCancel}>Cancel</PillButton>
        <PillButton type="submit" variant="primary" size="sm" isDisabled={!word}>Add exception</PillButton>
      </span>
    </form>
  );
}
