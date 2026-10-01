import { Spinner } from '@heroui/react';
import { IconButton, Kbd, PillButton } from './buttons';
import { Icon } from './icons';
import { Text } from './typography';

// Each bar's share of the level, so a voice reads as a shape rather than one block.
const BARS = [0.45, 0.75, 1, 0.75, 0.45];

/**
 * Voice input under way: listening (bars that move with the voice, the elapsed time, the words heard
 * so far; Stop ↵ sends it) or transcribing; ✕ (Esc) drops it. `level` 0..1 is the mic's loudness right now.
 */
export function Recording({ transcribing, level = 0, seconds = 0, text, onStop, onCancel }: {
  transcribing: boolean;
  level?: number;
  seconds?: number;
  /** The live transcript so far, all of it; past ~8 lines it scrolls, the newest words kept in view. */
  text?: string;
  onStop: () => void;
  onCancel: () => void;
}) {
  return (
    <>
    <div className="flex h-10 items-center gap-2 pl-2.5 pr-1">
      {transcribing ? (
        <Spinner size="sm" className="text-tm-accent" />
      ) : (
        <span aria-hidden className="flex h-5 items-center gap-[3px]">
          {BARS.map((share, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-tm-danger-ink transition-[height] duration-100"
              style={{ height: `${Math.max(3, Math.round(level * share * 20))}px` }}
            />
          ))}
        </span>
      )}
      <Text variant="label">{transcribing ? 'Transcribing…' : 'Listening…'}</Text>
      {!transcribing && (
        <Text variant="meta" className="tabular-nums" aria-label="Recording time">
          {Math.floor(seconds / 60)}:{String(Math.floor(seconds % 60)).padStart(2, '0')}
        </Text>
      )}
      <span className="grow" />
      {!transcribing && (
        <PillButton variant="primary" size="md" onPress={onStop}>
          Stop <Kbd tone="onAccent">↵</Kbd>
        </PillButton>
      )}
      <IconButton aria-label="Cancel" size={28} onPress={onCancel}>
        <Icon name="close" size={14} />
      </IconButton>
    </div>
    {text && (
      // column-reverse keeps the box scrolled to its end as lines arrive, with no script.
      <div className="mx-2.5 mb-1.5 flex max-h-48 flex-col-reverse overflow-y-auto">
        <p aria-live="polite" dir="auto" className="my-0 whitespace-pre-wrap tm-body text-tm-secondary">{text}</p>
      </div>
    )}
    </>
  );
}
