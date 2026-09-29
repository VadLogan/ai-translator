import { Spinner } from '@heroui/react';
import { PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { Divider, Item, Status } from '../../../components/menu';
import { Text } from '../../../components/typography';
import type { WidgetView } from '../view';

/** The small one-message panels: busy, not text, sign in, error. */

export function BusyPanel({ view }: { view: Extract<WidgetView, { kind: 'busy' }> }) {
  return (
    <Status>
      <Spinner size="sm" className="text-tm-accent" />
      <span dir="auto">{view.label}</span>
    </Status>
  );
}

/** Random keystrokes: nothing to press until the text changes. */
export function NotTextPanel() {
  return (
    <div className="m-0.5 flex items-start gap-2 rounded-[18px] bg-tm-warning-soft p-3 text-tm-warning-ink">
      <Icon name="question" size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <Text variant="label" className="text-tm-warning-ink">Doesn't look like text</Text>
        <span className="tm-meta">It isn't a language on either keyboard layout. Change the text to translate or check it.</span>
      </div>
    </div>
  );
}

export function SignInPanel({ view, onOpenSettings }: { view: Extract<WidgetView, { kind: 'signIn' }>; onOpenSettings: () => void }) {
  return (
    <>
      <div className="flex flex-col gap-1.5 p-1.5">
        <div className="flex items-center gap-2 px-1 pb-1 tm-label text-tm-secondary">
          <Icon name="lock" />
          Sign in to translate
        </div>
        {view.providers.map((provider) => (
          <PillButton key={provider.id} variant="soft" size="sm" fullWidth onPress={() => view.onPick(provider.id)}>
            Sign in with {provider.name}
          </PillButton>
        ))}
      </div>
      <Divider />
      <Item label="Settings…" icon="settings" muted onPress={onOpenSettings} />
    </>
  );
}

export function ErrorPanel({ view, onOpenSettings }: { view: Extract<WidgetView, { kind: 'error' }>; onOpenSettings: () => void }) {
  return (
    <>
      <div className="px-2.5 py-2 text-tm-danger-ink">{view.message}</div>
      <Divider />
      <Item label="Back" icon="back" onPress={view.onBack} />
      <Item label="Settings…" icon="settings" muted onPress={onOpenSettings} />
    </>
  );
}
