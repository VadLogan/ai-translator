import type { FixEdit, FixGrammarOk } from '../../../shared/contract';

const SPAN = /<span class="fix" data-original="[^"]*">([^<]*)<\/span>/g;

/** `fix` once `edit` was applied to the text it was made for: the edit gone, the later ones shifted, its span unwrapped. */
export function withoutFixEdit(fix: FixGrammarOk, edit: FixEdit): FixGrammarOk {
  const index = fix.edits.findIndex((e) => e.start === edit.start && e.end === edit.end);
  if (index < 0) return fix;
  const delta = edit.replacement.length - (edit.end - edit.start);
  const edits = fix.edits.filter((_, i) => i !== index).map((e, i) => (i < index ? e : { ...e, start: e.start + delta, end: e.end + delta }));
  let n = 0;
  const html = fix.html.replace(SPAN, (span, inner: string) => (n++ === index ? inner : span));
  return { ...fix, html, edits };
}

/** `text` with `edits` applied; right to left, so the earlier offsets still hold. */
export function applyEdits(text: string, edits: readonly FixEdit[]): string {
  return [...edits].sort((a, b) => b.start - a.start).reduce((out, e) => out.slice(0, e.start) + e.replacement + out.slice(e.end), text);
}
