import { Skeleton } from '@heroui/react';
import { PillButton } from '../../../components/buttons';
import { Flag } from '../../../components/icons';
import { Text } from '../../../components/typography';
import { languageName } from '../../../core/languages';
import type { WidgetView } from '../view';

type Translation = NonNullable<Extract<WidgetView, { kind: 'languages' }>['translation']>;

/** Page text's translation, under the menu's detected line: skeleton lines while it loads, then the text to copy. `onInsert`: a dictation's, written into the field. */
export function TranslationField({ view, onInsert }: { view: Translation; onInsert?: () => void }) {
  return (
    <div className="mx-1 mb-1 rounded-2xl bg-tm-subtle px-3 py-2">
      <div className="flex items-center gap-2">
        <Flag lang={view.lang} width={18} />
        <Text variant="label" className="grow">{languageName(view.lang)}</Text>
        <PillButton variant="ghost" size="xs" isDisabled={view.text === undefined} onPress={view.onCopy}>Copy</PillButton>
        {onInsert && <PillButton variant="primary" size="xs" isDisabled={view.text === undefined} onPress={onInsert}>Insert</PillButton>}
      </div>
      {view.text !== undefined ? (
        <p lang={view.lang} dir="auto" className="my-0 mt-1.5 max-h-[7.5rem] overflow-auto tm-body leading-relaxed">{view.text}</p>
      ) : view.error !== undefined ? (
        <p className="my-0 mt-1.5 tm-meta text-tm-muted">{view.error}</p>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2 pb-1" aria-label="Translating">
          {Array.from({ length: view.lines }, (_, index) => (
            <Skeleton key={index} className={`h-3 rounded-full ${index === view.lines - 1 && view.lines > 1 ? 'w-3/5' : 'w-full'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
