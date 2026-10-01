import { PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import type { Dictation } from '../view';

/** What was said, collapsed (a native <details>: it opens on click). */
export function Transcript({ text }: { text: string }) {
  return (
    <details className="group mx-1 mb-1 rounded-2xl px-2 py-1">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 tm-meta text-tm-muted">
        <Icon name="mic" size={12} />
        Transcribed
        <Icon name="forward" size={11} className="transition-transform group-open:rotate-90" />
      </summary>
      <p className="my-0 mt-1 max-h-[6rem] overflow-auto whitespace-pre-wrap tm-body text-tm-secondary">{text}</p>
    </details>
  );
}

/** A dictation's grammar panel ends here: the transcript, then Insert (into the field) and Copy. */
export function DictationBar({ dictation }: { dictation: Dictation }) {
  return (
    <>
      <Transcript text={dictation.transcript} />
      <div className="flex items-center justify-end gap-1.5 px-1 pb-1">
        <PillButton size="sm" onPress={dictation.onCopy}>Copy</PillButton>
        <PillButton variant="primary" size="sm" onPress={dictation.onInsert}>Insert</PillButton>
      </div>
    </>
  );
}
