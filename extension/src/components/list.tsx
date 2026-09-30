import type { ReactNode } from 'react';
import { IconButton } from './buttons';
import { Icon } from './icons';
import { Text } from './typography';

/** List building blocks for the extension pages: a back header, labelled card groups, selectable rows. */

export function SubHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return (
    <header className="flex h-[60px] shrink-0 items-center gap-1.5 px-2.5">
      <IconButton aria-label="Back" tone="ghost" size={36} className="text-tm-ink" onPress={onBack}>
        <Icon name="arrowBack" size={18} strokeWidth={1.9} />
      </IconButton>
      <Text variant="sectionTitle" className="grow">{title}</Text>
      {action}
    </header>
  );
}

export function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="groupLabel" tone="secondary" className="px-1">{label}</Text>
      <div className="flex flex-col gap-0.5 rounded-3xl bg-tm-surface p-1.5 shadow-tm-card">{children}</div>
    </div>
  );
}

/** `action` is a control at the row's right edge, a sibling of the row's button (buttons can't nest). */
export function Row({ selected, compact, icon, onPress, action, children }: { selected: boolean; compact?: boolean; icon: ReactNode; onPress: () => void; action?: ReactNode; children: ReactNode }) {
  const row = (
    <button
      type="button"
      onClick={onPress}
      aria-current={selected || undefined}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left outline-none hover:bg-tm-subtle focus-visible:shadow-tm-ring ${compact ? 'min-h-10' : 'min-h-12'} ${selected ? 'bg-tm-neutral hover:bg-tm-neutral' : ''}`}
    >
      {icon}
      {children}
      {action && <span className="w-8 shrink-0" />}
    </button>
  );
  if (!action) return row;
  return (
    <div className="group relative">
      {row}
      <span className="absolute inset-y-0 right-2.5 flex items-center">{action}</span>
    </div>
  );
}
