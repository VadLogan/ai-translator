import type { Segment } from './diff.ts';
import { escapeHtml } from './escapeHtml.ts';

/**
 * Plain text to apply, and escaped HTML where every edit is a `<span class="fix">` carrying what it
 * replaced in `data-original`. Built here, not by the model, so user text can never inject markup.
 */
export function fromSegments(segments: Segment[]): { text: string; html: string } {
  return {
    text: segments.map((s) => s.text).join(''),
    html: segments
      .map(({ text, original }) =>
        original === null
          ? escapeHtml(text)
          : `<span class="fix" data-original="${escapeHtml(original)}">${escapeHtml(text)}</span>`,
      )
      .join(''),
  };
}
