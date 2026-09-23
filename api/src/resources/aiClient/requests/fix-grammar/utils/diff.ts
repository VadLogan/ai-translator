import { tokenize } from './tokenize.ts';

/** A run of the corrected text. `original` is null when the run is unchanged, else the input it replaced. */
export interface Segment {
  text: string;
  original: string | null;
}

/**
 * Token-level LCS diff of input vs corrected. An edit is a word or a punctuation mark; edits
 * separated only by whitespace merge into one range ("go quick" → "quickly went"). Done here
 * rather than by the model, which is unreliable at keeping edits minimal.
 * ponytail: O(n·m) table, fine at MAX_TEXT_LENGTH (5000 chars); Myers diff if that ever grows.
 */
export function diff(input: string, corrected: string): Segment[] {
  const a = tokenize(input);
  const b = tokenize(corrected);
  const w = b.length + 1;
  // lcs[i * w + j] = LCS length of a[i:] and b[j:]
  const lcs = new Uint16Array((a.length + 1) * w);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i * w + j] = a[i] === b[j] ? lcs[(i + 1) * w + j + 1]! + 1 : Math.max(lcs[(i + 1) * w + j]!, lcs[i * w + j + 1]!);
    }
  }

  const segments: Segment[] = [];
  let removed = '';
  let added = '';
  const flushEdit = () => {
    if (!removed && !added) return;
    const [edit, gap] = segments.slice(-2);
    if (edit?.original != null && gap?.original === null && !gap.text.trim()) {
      segments.splice(-2, 2, { text: edit.text + gap.text + added, original: edit.original + gap.text + removed });
    } else {
      segments.push({ text: added, original: removed });
    }
    removed = added = '';
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      flushEdit();
      const last = segments.at(-1);
      if (last?.original === null) last.text += a[i];
      else segments.push({ text: a[i]!, original: null });
      i++;
      j++;
    } else if (j < b.length && (i === a.length || lcs[i * w + j + 1]! >= lcs[(i + 1) * w + j]!)) {
      added += b[j++];
    } else {
      removed += a[i++];
    }
  }
  flushEdit();
  return segments;
}
