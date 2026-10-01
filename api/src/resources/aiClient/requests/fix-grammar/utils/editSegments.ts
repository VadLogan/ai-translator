import type { FixEdit } from '../../../../../../../shared/contract.ts';
import type { Segment } from './diff.ts';

/** The input re-cut along `edits`, so fromSegments' spans are the same edits, one for one, in order. */
export function editSegments(input: string, edits: FixEdit[]): Segment[] {
  const segments: Segment[] = [];
  let at = 0;
  for (const { start, end, original, replacement } of edits) {
    if (start > at) segments.push({ text: input.slice(at, start), original: null });
    segments.push({ text: replacement, original });
    at = end;
  }
  if (at < input.length) segments.push({ text: input.slice(at), original: null });
  return segments;
}
