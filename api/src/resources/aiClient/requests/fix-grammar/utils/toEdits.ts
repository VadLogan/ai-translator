import type { FixEdit, FixKind } from '../../../../../../../shared/contract.ts';
import type { Segment } from './diff.ts';

/** What the model says about one edit. Its offsets are never trusted: those come from the diff. */
export interface ModelEdit {
  original: string;
  replacement: string;
  kind: FixKind;
  reason: string;
}

interface Span {
  start: number;
  end: number;
  /** The same edit's range in the corrected text. */
  cStart: number;
  cEnd: number;
}

/**
 * The diff's edits with offsets into the input, labelled with the model's `kind` and `reason`.
 * An edit whose either side is only whitespace (an insertion, a deletion) takes in the word next to
 * it: the underline needs something to sit under, and replaceSelection's whitespace trim would
 * otherwise eat it. Widening stops at the neighbouring edit, so edits never overlap.
 */
export function toEdits(segments: Segment[], model: ModelEdit[]): FixEdit[] {
  const input = segments.map((s) => s.original ?? s.text).join('');
  const corrected = segments.map((s) => s.text).join('');
  const spans: Span[] = [];
  let i = 0;
  let c = 0;
  for (const { text, original } of segments) {
    const length = (original ?? text).length;
    if (original !== null) spans.push({ start: i, end: i + length, cStart: c, cEnd: c + text.length });
    i += length;
    c += text.length;
  }

  const merged: Span[] = [];
  spans.forEach((span, n) => {
    const prev = merged.at(-1);
    const prevEnd = prev?.end ?? 0;
    const nextStart = spans[n + 1]?.start ?? input.length;
    if (!input.slice(span.start, span.end).trim() || !corrected.slice(span.cStart, span.cEnd).trim()) {
      // Unchanged text sits on both sides of an edit, so both ranges move together.
      const before = Math.min(/\S+$/.exec(input.slice(0, span.start))?.[0].length ?? 0, span.start - prevEnd);
      const after = Math.min(/^\S+/.exec(input.slice(span.end))?.[0].length ?? 0, nextStart - span.end);
      const back = Math.min(/\S+\s*$/.exec(input.slice(0, span.start))?.[0].length ?? 0, span.start - prevEnd);
      if (before) Object.assign(span, { start: span.start - before, cStart: span.cStart - before });
      else if (after) Object.assign(span, { end: span.end + after, cEnd: span.cEnd + after });
      else if (back) Object.assign(span, { start: span.start - back, cStart: span.cStart - back });
      // ponytail: boxed in by the previous edit -- fold into it rather than underline nothing.
      else if (prev) return Object.assign(prev, { end: span.end, cEnd: span.cEnd });
      else return; // whitespace-only text: nothing to underline
    }
    merged.push(span);
  });

  const used = new Set<number>();
  return merged.map(({ start, end, cStart, cEnd }) => {
    const original = input.slice(start, end);
    const replacement = corrected.slice(cStart, cEnd);
    const n = model.findIndex((m, k) => !used.has(k) && (overlaps(m.original, original) || overlaps(m.replacement, replacement)));
    used.add(n);
    return { start, end, original, replacement, kind: model[n]?.kind ?? 'error', reason: model[n]?.reason ?? '' };
  });
}

function overlaps(a: string, b: string): boolean {
  const x = a.trim();
  const y = b.trim();
  return !!x && !!y && (x.includes(y) || y.includes(x));
}
