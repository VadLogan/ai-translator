import { useRef, useState } from 'react';
import type { ResultKind, ResultView, TranscriptLineView } from '../core/transcript';
import { IconButton } from './buttons';
import { Icon, type IconName } from './icons';

/*
 * A meeting transcript's line, shared by the live meeting card and the popup's meeting detail.
 * Other speakers: press and drag across words to highlight them, then Translate / Explain / Add to
 * vocabulary. The user's own lines: the error count, and "Show fixes" opens the fix under the line.
 * The highlight is ours, not the browser selection: inside the meeting card's shadow root mousedown
 * is prevented (focus stays in the page's field), which also blocks native selection.
 */

export interface TranscriptCallbacks {
  onHighlight(line: string, from: number, to: number): void;
  onClearHighlight(): void;
  onAction(line: string, kind: Exclude<ResultKind, 'fix'>): void;
  onShowFixes(line: string, open: boolean): void;
  onCloseResult(line: string): void;
  onUndoVocab(line: string): void;
}

const ACTIONS: { kind: Exclude<ResultKind, 'fix'>; label: string; icon: IconName }[] = [
  { kind: 'translate', label: 'Translate', icon: 'translate' },
  { kind: 'explain', label: 'Explain', icon: 'question' },
  { kind: 'vocab', label: 'Add to vocabulary', icon: 'add' },
];

export function TranscriptLine({ line, callbacks }: { line: TranscriptLineView; callbacks: TranscriptCallbacks }) {
  // Where the drag started; null when no button is down on this line's words.
  const anchor = useRef<number | null>(null);
  const lit = line.highlighted || !!line.result;
  return (
    <div className={`flex flex-col gap-0.5 rounded-xl px-2.5 py-2 ${lit ? 'bg-tm-subtle' : ''}`}>
      <span className="flex items-baseline gap-2">
        <span className="text-[12.5px] font-semibold" style={{ color: line.color }}>
          {line.name}
        </span>
        <span className="text-[11.5px] text-tm-placeholder tabular-nums">{line.t}</span>
      </span>
      <span className={`text-[13.5px] leading-[1.45] text-tm-ink ${line.me ? '' : 'select-none'}`} onPointerUp={() => (anchor.current = null)}>
        {line.pieces.map((p, i) =>
          line.me || !p.word ? (
            <span key={i} className={p.lit ? 'bg-tm-soft text-tm-accent-text' : ''}>
              {p.text}
            </span>
          ) : (
            <span
              key={i}
              className={`cursor-pointer rounded-[3px] ${p.lit ? 'bg-tm-soft text-tm-accent-text' : 'hover:bg-tm-neutral'}`}
              onPointerDown={(e) => {
                if (e.button) return;
                // A lone highlighted word pressed again: un-highlight.
                const only = line.pieces.filter((x) => x.lit).length === 1 && p.lit;
                anchor.current = only ? null : i;
                if (only) callbacks.onClearHighlight();
                else callbacks.onHighlight(line.id, i, i);
              }}
              onPointerEnter={(e) => {
                if (anchor.current !== null && e.buttons & 1) callbacks.onHighlight(line.id, anchor.current, i);
              }}
            >
              {p.text}
            </span>
          ),
        )}
      </span>
      {line.check && <CheckRow check={line.check} onShowFixes={(open) => callbacks.onShowFixes(line.id, open)} />}
      {line.highlighted && (
        <span className="flex flex-wrap gap-1.5 pt-1.5">
          {ACTIONS.map((a) => (
            <button
              key={a.kind}
              type="button"
              onClick={() => callbacks.onAction(line.id, a.kind)}
              className="flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-tm-line bg-tm-surface px-2.5 text-[12.5px] font-medium text-tm-ink hover:bg-tm-neutral"
            >
              <Icon name={a.icon} size={13} />
              {a.label}
            </button>
          ))}
        </span>
      )}
      {line.result && <ResultCard result={line.result} onClose={() => callbacks.onCloseResult(line.id)} onUndo={() => callbacks.onUndoVocab(line.id)} />}
    </div>
  );
}

function CheckRow({ check, onShowFixes }: { check: NonNullable<TranscriptLineView['check']>; onShowFixes: (open: boolean) => void }) {
  return (
    <span className="flex items-center gap-1.5 pt-0.5 text-[12px] text-tm-muted" aria-live="polite">
      {check.kind === 'checking' && 'Checking…'}
      {check.kind === 'failed' && "Couldn't check this line"}
      {check.kind === 'clean' && (
        <>
          <Icon name="check" size={12} strokeWidth={2.4} className="text-tm-success" /> No errors
        </>
      )}
      {check.kind === 'errors' && (
        <>
          <span className="font-semibold text-tm-warning-ink">
            {check.count >= 9 ? '9+' : check.count} error{check.count === 1 ? '' : 's'}
          </span>
          ·
          <button type="button" onClick={() => onShowFixes(check.open)} className="cursor-pointer border-0 bg-transparent p-0 text-tm-accent-text underline underline-offset-[3px]">
            {check.open ? 'Hide fixes' : 'Show fixes'}
          </button>
        </>
      )}
    </span>
  );
}

export function ResultCard({ result, onClose, onUndo }: { result: ResultView; onClose?: () => void; onUndo?: () => void }) {
  return (
    <div className="mt-1.5 flex flex-col gap-1 rounded-xl border border-tm-line bg-tm-surface px-2.5 py-2" aria-live="polite">
      <div className="flex items-center gap-1.5">
        <span className={`grow text-[11.5px] font-semibold ${result.kind === 'error' ? 'text-tm-danger-ink' : 'text-tm-accent-text'}`}>{result.title}</span>
        {onClose && (
          <IconButton aria-label="Close" tone="ghost" size={24} onPress={onClose}>
            <Icon name="close" size={12} strokeWidth={2.2} />
          </IconButton>
        )}
      </div>
      {result.kind === 'loading' && (
        <span className="flex flex-col gap-1.5 py-0.5" aria-label="Loading">
          <span className="h-3 w-4/5 animate-pulse rounded bg-tm-neutral" />
          <span className="h-3 w-1/2 animate-pulse rounded bg-tm-neutral" />
        </span>
      )}
      {result.kind === 'error' && <span className="text-[13px] text-tm-secondary">Something went wrong. Try again.</span>}
      {result.kind === 'clean' && (
        <span className="flex items-center gap-1.5 text-[13px]">
          <Icon name="check" size={14} className="text-tm-success" /> Looks right — nothing to fix.
        </span>
      )}
      {result.kind === 'body' && (
        <>
          <span lang={result.lang} className="text-[13px] leading-[1.45] text-tm-ink">
            {result.body}
          </span>
          {result.list.map((item) => (
            <span key={item} className="rounded-lg bg-tm-subtle px-2 py-1 text-[13px] text-tm-ink">
              {item}
            </span>
          ))}
        </>
      )}
      {result.kind === 'vocab' && (
        <span className="text-[13px] leading-[1.45] text-tm-ink">
          <span className="font-semibold">{result.word}</span> — {result.meaning}{' '}
          {onUndo && (
            <button type="button" onClick={onUndo} className="cursor-pointer border-0 bg-transparent p-0 text-[12px] text-tm-accent-text underline underline-offset-[3px]">
              Undo
            </button>
          )}
        </span>
      )}
      {result.kind === 'fix' && (
        <>
          <span className="text-[13px] leading-[1.6] text-tm-ink">
            {result.parts.map((p, i) => (
              <span key={i} className={p.kind === 'del' ? 'mr-1 text-tm-muted line-through' : p.kind === 'ins' ? 'font-semibold' : ''}>
                {p.text}
              </span>
            ))}
          </span>
          {result.why && <span className="text-[12px] text-tm-secondary">{result.why}</span>}
        </>
      )}
    </div>
  );
}

/** The speakers' colours. Names are buttons that rename only when `onRename` is given (the live card). */
export function SpeakerLegend({
  speakers,
  renaming = null,
  onRenameStart,
  onRename,
  hint,
  className = '',
}: {
  speakers: readonly { id: string; name: string; color: string }[];
  renaming?: string | null;
  onRenameStart?: (id: string | null) => void;
  onRename?: (id: string, name: string) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 text-[12px] text-tm-muted ${className}`}>
      {speakers.map((s) => (
        <span key={s.id} className="flex items-center gap-[5px]">
          <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
          {onRename && renaming === s.id ? (
            <RenameInput name={s.name} onSave={(name) => onRename(s.id, name)} onCancel={() => onRenameStart?.(null)} />
          ) : onRename ? (
            <button type="button" title="Rename" onClick={() => onRenameStart?.(s.id)} className="cursor-pointer border-0 bg-transparent p-0 text-inherit hover:text-tm-ink hover:underline">
              {s.name}
            </button>
          ) : (
            s.name
          )}
        </span>
      ))}
      {hint && (
        <>
          <span className="grow" />
          <span>{hint}</span>
        </>
      )}
    </div>
  );
}

function RenameInput({ name, onSave, onCancel }: { name: string; onSave: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(name);
  return (
    <input
      type="text"
      autoFocus
      aria-label="Speaker name"
      value={value}
      maxLength={40}
      size={Math.max(4, value.length)}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => onSave(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(value);
        if (e.key === 'Escape') onCancel();
      }}
      className="h-5 rounded-md border border-tm-line bg-tm-surface px-1 text-[12px] text-tm-ink outline-none focus:border-tm-accent"
    />
  );
}
