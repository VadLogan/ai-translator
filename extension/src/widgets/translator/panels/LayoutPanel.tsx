import { IconButton, Kbd, PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { Text } from '../../../components/typography';
import { languageName } from '../../../core/languages';
import type { WidgetView } from '../view';

/** Wrong keyboard layout: the typed text struck through, the re-typed one, and "Fix the characters". */
export function LayoutPanel({ view, onFixLayout }: { view: Extract<WidgetView, { kind: 'layout' }>; onFixLayout: () => void }) {
  return (
    <>
      <div className="m-0.5 flex flex-col gap-2.5 rounded-[18px] bg-tm-soft p-3 text-tm-accent-text">
        <div className="flex items-center gap-2">
          <Icon name="keyboard" size={15} strokeWidth={1.9} />
          <Text variant="label" tone="accent" className="grow">Wrong keyboard layout</Text>
          <IconButton aria-label="Close" tone="accent" size={24} onPress={view.onClose}>
            <Icon name="close" size={12} strokeWidth={2.6} />
          </IconButton>
        </div>
        <div className="flex flex-col gap-0.5">
          <span lang={view.from} className="text-[12px] line-through">{view.typed}</span>
          <span lang={view.to} className="text-[15px] font-semibold text-tm-ink">{view.fixed}</span>
        </div>
        <PillButton variant="primary" size="sm" fullWidth onPress={onFixLayout}>
          Fix the characters <Kbd tone="onAccent">F</Kbd>
        </PillButton>
      </div>
      <div className="flex h-10 items-center gap-2 pl-2.5 pr-1">
        <Icon name="script" size={14} strokeWidth={1.9} className="text-tm-placeholder" />
        <Text variant="label" tone="muted" className="grow font-normal">Reads as {languageName(view.from)}</Text>
        {/* Not wired up yet, like the menu's Change. */}
        <PillButton variant="ghost" size="xs" isDisabled aria-label="Change the detected language" className="gap-1.5 disabled:bg-transparent">
          Change
          <Kbd>C</Kbd>
        </PillButton>
      </div>
    </>
  );
}
