import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { Kbd } from './buttons';
import { Flag, Icon, type IconName } from './icons';

/** Menu building blocks for the in-page panels: rows, titled sections, separators, a status line. */

export function Divider() {
  return <div role="separator" className="mx-1 my-1 h-px bg-tm-line" />;
}

export function Status({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 px-2.5 py-2">{children}</div>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="px-2.5 pb-1 pt-2 tm-group-label text-tm-muted">{title}</div>
      {children}
    </div>
  );
}

/** A menu row: icon or flag, label, then a key hint or a trailing note. */
export function Item({
  label,
  hint,
  shortcut,
  icon,
  flag,
  muted,
  disabled,
  onPress,
}: {
  label: string;
  hint?: ReactNode;
  shortcut?: string;
  icon?: IconName;
  /** A language code; rows without a flag for it keep the slot so labels stay aligned. */
  flag?: string;
  muted?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      variant="ghost"
      fullWidth
      isDisabled={disabled}
      className={`h-8 min-h-0 justify-between gap-3 rounded-xl px-2.5 tm-label hover:bg-tm-subtle ${muted ? 'text-tm-muted' : 'text-tm-ink'}`}
      onPress={onPress}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {(icon !== undefined || flag !== undefined) && (
          <span>{icon !== undefined ? <Icon name={icon} /> : <Flag lang={flag!} width={18} />}</span>
        )}
        <span className="truncate">{label}</span>
      </div>
      {shortcut !== undefined ? <Kbd tone="row">{shortcut}</Kbd> : hint !== undefined && <span className="tm-meta text-tm-muted">{hint}</span>}
    </Button>
  );
}
