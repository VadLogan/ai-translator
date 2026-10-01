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

/** A piece of a field's text sent to /fix-grammar on its own; `start` is where it sits in the field. */
export interface Chunk {
  start: number;
  text: string;
}

/** The fix of a text the check found clean: unchanged, nothing to underline, no request needed. */
export const cleanFix = (text: string): FixGrammarOk => ({ text, html: escapeHtml(text), edits: [] });

/** The sentence is done: ends in . ! ? … (or CJK ones), maybe followed by a closing quote or bracket. */
export const isFinished = (text: string): boolean => /[.!?…。！？]["'”’»)\]]*\s*$/.test(text);

/**
 * The field-wide fix made of its chunks' fixes, as if the API had fixed the whole field: edits
 * moved to field offsets, `text` and `html` the field with each chunk swapped for its fixed version.
 * `parts` in field order.
 */
export function mergeFixes(text: string, parts: { chunk: Chunk; fix: FixGrammarOk }[]): FixGrammarOk {
  const merged: FixGrammarOk = { text: '', html: '', edits: [] };
  let at = 0;
  for (const { chunk, fix } of parts) {
    const gap = text.slice(at, chunk.start);
    merged.text += gap + fix.text;
    merged.html += escapeHtml(gap) + fix.html;
    merged.edits.push(...fix.edits.map((e) => ({ ...e, start: e.start + chunk.start, end: e.end + chunk.start })));
    at = chunk.start + chunk.text.length;
  }
  const rest = text.slice(at);
  merged.text += rest;
  merged.html += escapeHtml(rest);
  return merged;
}

// The API's escaping (api/.../fix-grammar/utils/escapeHtml.ts), so merged html reads the same.
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
