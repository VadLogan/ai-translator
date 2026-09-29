import type { ReactNode } from 'react';
import { Button, type ButtonProps } from '@heroui/react';

/*
 * The design's button set, on top of HeroUI's Button so press handling, focus ring and
 * `isDisabled` stay react-aria's. HeroUI's styles live in `@layer components`, so these utility
 * classes win without `!`. `variant="ghost"` is passed only to keep HeroUI's own fills out of
 * the way. Radius is always full, weight always 500.
 */

const PILL_VARIANT = {
  primary: 'bg-tm-accent text-tm-on-accent hover:bg-tm-accent-hover',
  secondary: 'bg-tm-neutral text-tm-ink hover:bg-tm-neutral/80',
  soft: 'bg-tm-soft text-tm-accent-text hover:bg-tm-soft/80',
  ghost: 'bg-transparent text-tm-ink hover:bg-tm-neutral px-2.5',
  dashed: 'bg-transparent text-tm-ink hover:bg-tm-neutral/60 border border-dashed border-tm-dash',
} as const;

/** 40 main action · 36 in dialogs · 32 in rows · 28 compact. */
const PILL_SIZE = {
  lg: 'h-10 px-4 tm-label',
  md: 'h-9 px-3.5 text-[13.5px]',
  sm: 'h-8 px-3 text-[13px]',
  xs: 'h-7 px-3 text-[12px]',
} as const;

const BASE = 'min-w-0 rounded-full font-medium';
// A disabled button reads as secondary with grey text rather than HeroUI's faded opacity.
const DISABLED = 'disabled:opacity-100 disabled:bg-tm-neutral disabled:text-tm-placeholder disabled:border-transparent';

export type PillButtonProps = Omit<ButtonProps, 'variant' | 'size' | 'isIconOnly'> & {
  variant?: keyof typeof PILL_VARIANT;
  size?: keyof typeof PILL_SIZE;
};

export function PillButton({ variant = 'secondary', size = 'lg', className = '', ...rest }: PillButtonProps) {
  return (
    <Button
      {...rest}
      variant="ghost"
      className={`${BASE} gap-2 ${PILL_SIZE[size]} ${PILL_VARIANT[variant]} ${DISABLED} ${className}`}
    />
  );
}

const ICON_TONE = {
  neutral: 'bg-tm-neutral text-tm-ink hover:bg-tm-neutral/80',
  /** Pressed "liked" state. */
  accent: 'bg-tm-soft text-tm-accent-text hover:bg-tm-soft/80',
  /** Pressed "disliked" state. */
  danger: 'bg-tm-danger-soft text-tm-danger-ink hover:bg-tm-danger-soft/80',
  primary: 'bg-tm-accent text-tm-on-accent hover:bg-tm-accent-hover',
  ghost: 'bg-transparent text-tm-muted hover:bg-tm-neutral',
} as const;

const ICON_SIZE = { 24: 'size-6', 26: 'size-[26px]', 28: 'size-7', 32: 'size-8', 36: 'size-9' } as const;

export type IconButtonProps = Omit<ButtonProps, 'variant' | 'size' | 'isIconOnly'> & {
  /** Required: an icon-only button has no other accessible name. */
  'aria-label': string;
  tone?: keyof typeof ICON_TONE;
  size?: keyof typeof ICON_SIZE;
};

export function IconButton({ tone = 'neutral', size = 32, className = '', ...rest }: IconButtonProps) {
  return (
    <Button
      {...rest}
      isIconOnly
      variant="ghost"
      className={`${BASE} p-0 ${ICON_SIZE[size]} ${ICON_TONE[tone]} ${DISABLED} ${className}`}
    />
  );
}

const KBD_TONE = {
  /** Inside a button: h20. */
  button: 'h-5 rounded-md px-[5px] text-[11px] font-medium bg-tm-subtle text-tm-muted',
  /** Translucent, inside a primary button. */
  onAccent: 'h-5 rounded-md px-[5px] text-[11px] bg-white/20 text-current',
  /** Standalone, as a menu row's hint: h22. */
  row: 'h-[22px] min-w-[22px] justify-center rounded-lg px-1.5 text-[12px] bg-tm-neutral text-tm-muted',
} as const;

/** Shortcut chip. */
export function Kbd({ children, tone = 'button' }: { children: ReactNode; tone?: keyof typeof KBD_TONE }) {
  return <kbd className={`inline-flex items-center font-tm ${KBD_TONE[tone]}`}>{children}</kbd>;
}
