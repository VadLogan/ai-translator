import { Icon } from './icons';

/** A grammar check's result: the error count, 'error' = the check failed, 'layout' / 'gibberish' = the guard's verdict. */
export type Badge = number | 'error' | 'layout' | 'gibberish';

/**
 * The check's result as a pill: the error count, a check when clean, a warning "!" for a wrong
 * keyboard layout, a warning "?" for random keystrokes, a red "!" when the check failed.
 */
export function CountBadge({ count, className = '' }: { count: Badge; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none ${className} ${
        count === 'error' ? 'bg-tm-danger-ink text-tm-on-accent' : count === 'layout' || count === 'gibberish' || count > 0 ? 'bg-tm-warning text-tm-ink' : 'bg-tm-success text-tm-ink'
      }`}
    >
      {count === 'error' || count === 'layout' ? '!' : count === 'gibberish' ? '?' : count > 0 ? (count > 9 ? '9+' : count) : <Icon name="check" size={9} strokeWidth={3.4} />}
    </span>
  );
}
