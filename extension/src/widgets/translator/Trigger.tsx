import { useRef, useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { IconButton } from '../../components/buttons';
import { CountBadge } from '../../components/CountBadge';
import { BrandMark, Icon } from '../../components/icons';
import type { Anchor } from '../../content/selection';
import { cornerStyle, ICON_SIZE, iconStyle, viewportSize } from './position';
import type { WidgetView } from './view';

/** The round icon above a selection or in a field's corner, with its badge and the hover pill (a field's mic, "Turn off in this field"). */
export function Trigger({
  anchor,
  view: { field, badge, checking, canDisable, hovered = false },
  onPress,
  onDisable,
  onDictate,
}: {
  anchor: Anchor;
  view: Extract<WidgetView, { kind: 'icon' }>;
  onPress: () => void;
  onDisable: () => void;
  onDictate: () => void;
}) {
  // The pill stays a moment after the pointer leaves, so crossing the gap to its button keeps it open.
  const [open, setOpen] = useState(hovered);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const enter = () => {
    clearTimeout(hideTimer.current);
    setOpen(true);
  };
  const leave = () => {
    hideTimer.current = setTimeout(() => setOpen(false), 150);
  };
  const label = badge === 'layout'
    ? 'Wrong keyboard layout'
    : badge === 'gibberish'
    ? "Doesn't look like text"
    : !field
    ? 'Translate selection'
    : checking
      ? 'Checking grammar…'
      : badge === undefined
        ? 'Fix grammar'
        : badge === 'error'
          ? 'Grammar check failed'
          : `Fix grammar: ${badge === 1 ? '1 error' : `${badge} errors`}`;
  return (
    <div className="fixed size-[26px] motion-safe:animate-tm-appear" style={field ? cornerStyle(anchor) : iconStyle(anchor, viewportSize())} onPointerEnter={enter} onPointerLeave={leave}>
      {canDisable && open && (
        // Behind the icon and growing to the left: the corner icon sits on the field's right edge.
        <div
          role="group"
          aria-label="TypeMeant in this field"
          className="absolute -right-1 -top-1 flex h-[34px] items-center rounded-full bg-tm-surface py-1 pl-1 pr-[34px] shadow-tm-pop"
        >
          {field && (
            <IconButton aria-label="Voice input" size={26} onPress={onDictate}>
              <Icon name="mic" size={14} strokeWidth={2.2} />
            </IconButton>
          )}
          <IconButton aria-label="Turn off in this field" size={26} onPress={onDisable}>
            <Icon name="ban" size={14} strokeWidth={2.4} />
          </IconButton>
        </div>
      )}
      <Button
        isIconOnly
        variant="ghost"
        aria-label={label}
        className="relative size-[26px] min-w-0 overflow-visible rounded-full p-0 shadow-tm-pop"
        onPress={onPress}
      >
        <BrandMark size={ICON_SIZE} shape="round" />
        {checking && (
          <span aria-hidden className="absolute inset-0 flex items-center justify-center rounded-full bg-tm-surface/70">
            <Spinner size="sm" className="text-tm-accent" />
          </span>
        )}
        {badge !== undefined && <CountBadge count={badge} className="absolute -right-1.5 -top-1.5 ring-2 ring-tm-surface" />}
      </Button>
    </div>
  );
}
