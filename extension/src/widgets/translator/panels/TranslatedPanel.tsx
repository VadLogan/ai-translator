import { Kbd, PillButton } from '../../../components/buttons';
import { Flag } from '../../../components/icons';
import { Text } from '../../../components/typography';
import { languageName } from '../../../core/languages';
import type { WidgetView } from '../view';

/** A page selection's translation: page text is never replaced, so it is shown to copy. */
export function TranslatedPanel({ view }: { view: Extract<WidgetView, { kind: 'translated' }> }) {
  return (
    <>
      <div className="flex h-10 items-center gap-2 pl-2.5 pr-1">
        <Flag lang={view.lang} width={18} />
        <Text variant="label" className="grow">{languageName(view.lang)}</Text>
      </div>
      <p lang={view.lang} dir="auto" className="mx-1 my-0 rounded-2xl bg-tm-subtle px-3 py-2.5 tm-body leading-relaxed">
        {view.text}
      </p>
      <div className="flex px-1 pb-1 pt-2">
        <PillButton variant="primary" size="md" className="grow" onPress={view.onCopy}>Copy</PillButton>
      </div>
      <div className="flex items-center justify-center gap-1.5 px-2 pb-1 pt-1.5 tm-meta text-tm-muted">
        <Kbd>Esc</Kbd> closes
      </div>
    </>
  );
}
