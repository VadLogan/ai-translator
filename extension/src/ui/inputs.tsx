import { useId, type ComponentProps, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { IconButton } from './buttons';
import { Icon } from './icons';

/*
 * The design's fields and controls. Native elements wherever the platform already has the
 * behavior (input, select, textarea, radio groups for arrow keys, a checkbox for the switch);
 * HeroUI's Button only where buttons.tsx already uses it.
 */

const FIELD = 'h-9 w-full rounded-xl bg-tm-subtle px-3 tm-body text-tm-ink outline-none';
const FOCUS = 'focus:bg-tm-surface focus:shadow-tm-ring';
const LABEL = 'tm-group-label text-tm-muted';
const CHEVRON = <Icon name="chevronDown" size={14} strokeWidth={2} className="shrink-0 text-tm-muted" />;

export function TextField({ label, className = '', ...rest }: ComponentProps<'input'> & { label: string }) {
  const id = useId();
  return (
    <span className={`inline-flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <input id={id} type="text" {...rest} className={`${FIELD} ${FOCUS} placeholder:text-tm-placeholder`} />
    </span>
  );
}

export function SearchField({ className = '', ...rest }: Omit<ComponentProps<'input'>, 'type'> & { 'aria-label': string }) {
  return (
    <span className={`inline-flex h-10 items-center gap-2 rounded-xl bg-tm-subtle px-3 focus-within:bg-tm-surface focus-within:shadow-tm-ring ${className}`}>
      <Icon name="search" size={15} strokeWidth={2} className="shrink-0 text-tm-muted" />
      <input type="search" {...rest} className="min-w-0 flex-1 bg-transparent tm-body text-tm-ink caret-tm-accent outline-none placeholder:text-tm-placeholder" />
    </span>
  );
}

/** A native select dressed as a field; the chevron is drawn over it and lets clicks through. */
export function Select({ className = '', children, ...rest }: ComponentProps<'select'>) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <select {...rest} className={`${FIELD} ${FOCUS} appearance-none pr-8`}>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">{CHEVRON}</span>
    </span>
  );
}

export function TextAreaCard({ label, className = '', ...rest }: ComponentProps<'textarea'> & { label: string }) {
  const id = useId();
  return (
    <span className={`inline-flex flex-col gap-1 rounded-xl bg-tm-surface px-3 py-2.5 shadow-tm-card focus-within:shadow-tm-ring ${className}`}>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <textarea id={id} rows={2} {...rest} className="resize-none bg-transparent tm-body text-tm-ink outline-none placeholder:text-tm-placeholder" />
    </span>
  );
}

/** "Detected · Polish" with a flag: a button that opens a language picker. */
export function LanguageCard({ flag, caption, name, onPress }: { flag?: ReactNode; caption: string; name: string; onPress?: () => void }) {
  return (
    <Button
      variant="ghost"
      onPress={onPress}
      className="h-11 w-full min-w-0 justify-start gap-2 rounded-xl bg-tm-surface pl-3 pr-2.5 text-left text-tm-ink shadow-tm-card hover:bg-tm-surface"
    >
      {flag}
      <span className="flex grow flex-col">
        <span className="tm-meta text-tm-muted">{caption}</span>
        <span className="tm-label">{name}</span>
      </span>
      {CHEVRON}
    </Button>
  );
}

/** A checkbox with `role="switch"`: space toggles it, forms and labels just work. */
export function Switch({ className = '', ...rest }: Omit<ComponentProps<'input'>, 'type' | 'role'>) {
  return (
    <span className={`relative inline-flex h-5 w-10 shrink-0 ${className}`}>
      <input
        type="checkbox"
        role="switch"
        {...rest}
        className="peer absolute inset-0 cursor-pointer appearance-none rounded-xl bg-tm-neutral outline-none transition-colors checked:bg-tm-accent focus-visible:shadow-tm-ring"
      />
      <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-[22px] rounded-lg bg-white shadow-[0_1px_2px_rgb(0_0_0/0.1)] transition-transform peer-checked:translate-x-3.5" />
    </span>
  );
}

/** Pick one of a few: native radios, so arrow keys move the choice. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex gap-0.5 rounded-[20px] bg-tm-neutral p-1">
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input type="radio" name={name} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)} className="peer sr-only" />
          <span className="flex h-[30px] items-center rounded-2xl px-3 text-[13px] font-medium text-tm-secondary peer-checked:bg-tm-surface peer-checked:text-tm-ink peer-checked:shadow-tm-card peer-focus-visible:shadow-tm-ring">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export function RemovableChip({ flag, label, onRemove }: { flag?: ReactNode; label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-2xl bg-tm-neutral pl-2.5 pr-1 text-[13px] font-medium text-tm-ink">
      {flag}
      {label}
      <IconButton aria-label={`Remove ${label}`} tone="ghost" size={24} className="hover:bg-tm-subtle" onPress={onRemove}>
        <Icon name="close" size={12} strokeWidth={2.4} />
      </IconButton>
    </span>
  );
}

const CHIP_TONE = {
  accent: 'bg-tm-soft text-tm-accent-text',
  neutral: 'bg-tm-subtle text-tm-ink',
  warning: 'bg-tm-warning-soft text-tm-warning-ink',
} as const;

export function StatusChip({ tone = 'accent', children }: { tone?: keyof typeof CHIP_TONE; children: ReactNode }) {
  return <span className={`rounded-2xl px-2 py-0.5 tm-group-label ${CHIP_TONE[tone]}`}>{children}</span>;
}

export function Meter({ value, max = 100, tone = 'accent', 'aria-label': ariaLabel, className = 'w-50' }: {
  value: number;
  max?: number;
  tone?: 'accent' | 'warning';
  'aria-label': string;
  className?: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <span role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={ariaLabel} className={`block h-1 overflow-hidden rounded-full bg-tm-neutral ${className}`}>
      <span className={`block h-1 ${tone === 'warning' ? 'bg-tm-warning' : 'bg-tm-accent'}`} style={{ width: `${percent}%` }} />
    </span>
  );
}
