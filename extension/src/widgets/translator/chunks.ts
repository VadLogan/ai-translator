import type { FixGrammarOk } from '../../../../shared/contract';
import { hasEnoughWords } from './state';

/** A piece of a field's text sent to /fix-grammar on its own; `start` is where it sits in the field. */
export interface Chunk {
  start: number;
  text: string;
}

const MAX_CHUNK = 600;

/**
 * A field's text cut into paragraphs, each trimmed (the API trims bodies, so offsets must agree),
 * a paragraph over 600 chars cut again into groups of whole sentences. Pieces under 3 words are
 * left out: they are never asked, so they get no edits.
 */
export function splitChunks(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  for (const line of text.matchAll(/[^\n]+/g)) {
    const pieces = line[0].length > MAX_CHUNK ? sentenceGroups(line[0]) : [{ start: 0, text: line[0] }];
    for (const piece of pieces) {
      const lead = piece.text.length - piece.text.trimStart().length;
      const trimmed = piece.text.trim();
      if (hasEnoughWords(trimmed)) chunks.push({ start: line.index + piece.start + lead, text: trimmed });
    }
  }
  return chunks;
}

/** Whole sentences, packed into groups up to MAX_CHUNK; a longer sentence stays a group of its own. */
function sentenceGroups(paragraph: string): Chunk[] {
  const groups: Chunk[] = [];
  for (const { index, segment } of new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(paragraph)) {
    const last = groups.at(-1);
    if (last && last.text.length + segment.length <= MAX_CHUNK) last.text += segment;
    else groups.push({ start: index, text: segment });
  }
  return groups;
}

/**
 * `chunk` cut into sentences for the cheap background /check, each with its field offset. A
 * sentence under 3 words joins the one before it (or, first, the one after), since texts that
 * short are never asked on their own -- except an unended last one, the sentence being typed.
 */
export function splitSentences(chunk: Chunk): Chunk[] {
  const groups: Chunk[] = [];
  let short: Chunk | null = null; // a leading piece too short to stand alone
  const segments = [...new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(chunk.text)];
  for (const [i, { index, segment }] of segments.entries()) {
    const piece: Chunk = short ? { start: short.start, text: short.text + segment } : { start: chunk.start + index, text: segment };
    const last = groups.at(-1);
    // The last piece, not ended yet, is being typed: it stays apart, or "My" would hold back the sentence before it.
    const typedOn = i === segments.length - 1 && !isFinished(piece.text);
    if (hasEnoughWords(piece.text) || (typedOn && last)) {
      groups.push(piece);
      short = null;
    } else if (last) last.text += piece.text;
    else short = piece;
  }
  if (short) groups.push(short); // the whole chunk is that short: splitChunks never makes one, but keep it whole
  return groups.map(({ start, text }) => ({ start, text: text.trimEnd() }));
}

/** The fix of a text the check found clean: unchanged, nothing to underline, no request needed. */
export const cleanFix = (text: string): FixGrammarOk => ({ text, html: escapeHtml(text), edits: [] });

/** The sentence is done: ends in . ! ? … (or CJK ones), maybe followed by a closing quote or bracket. */
export const isFinished = (text: string): boolean => /[.!?…。！？]["'”’»)\]]*\s*$/.test(text);

/**
 * `sentence` (of the field's `text`) is the one being typed: the caret is in it or after it with
 * only whitespace between ("…my brother |"), and it hasn't ended. Null caret: nobody is typing.
 */
export function isBeingTyped(text: string, sentence: Chunk, caret: number | null): boolean {
  if (caret === null || caret < sentence.start || isFinished(sentence.text)) return false;
  return !text.slice(sentence.start + sentence.text.length, caret).trim();
}

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

/**
 * A fix for `text` made of an earlier version's fix, while `text`'s own is fetched: the edits
 * outside the region that changed (whole words, found by the common start and end) are kept, the
 * ones after it shifted, the ones in it dropped. Null when less than half the earlier version survived.
 */
export function carryOver(text: string, from: { text: string; fix: FixGrammarOk }): FixGrammarOk | null {
  const old = from.text;
  let head = 0;
  const most = Math.min(old.length, text.length);
  while (head < most && old[head] === text[head]) head++;
  let tail = 0;
  while (tail < most - head && old[old.length - 1 - tail] === text[text.length - 1 - tail]) tail++;
  // Widen the change to whole words when it touches one: a word half-typed or half-deleted is a
  // different word. Text added after "apple." (starting with a space) leaves "apple." alone.
  const word = (c: string | undefined) => c !== undefined && /\S/.test(c);
  if (word(old[head]) || word(text[head])) while (head > 0 && word(old[head - 1])) head--;
  if (word(old[old.length - 1 - tail]) || word(text[text.length - 1 - tail])) while (tail > 0 && word(old[old.length - tail])) tail--;
  // ponytail: one changed region (how typing edits text); a version far off shares too little and gets none.
  // Half the earlier version must survive: else it's another text, not an edit of it.
  if (head + tail < Math.max(10, old.length / 2)) return null;
  const shift = text.length - old.length;
  const edits = from.fix.edits.flatMap((e) =>
    e.end <= head ? [e] : e.start >= old.length - tail ? [{ ...e, start: e.start + shift, end: e.end + shift }] : [],
  );
  return fixOf(text, edits);
}

/** The fix `edits` make of `text`, `html` built as the API builds it (fromSegments). */
export function fixOf(text: string, edits: FixGrammarOk['edits']): FixGrammarOk {
  let fixed = '';
  let html = '';
  let at = 0;
  for (const { start, end, original, replacement } of edits) {
    fixed += text.slice(at, start) + replacement;
    html += `${escapeHtml(text.slice(at, start))}<span class="fix" data-original="${escapeHtml(original)}">${escapeHtml(replacement)}</span>`;
    at = end;
  }
  return { text: fixed + text.slice(at), html: html + escapeHtml(text.slice(at)), edits };
}

// The API's escaping (api/.../fix-grammar/utils/escapeHtml.ts), so merged html reads the same.
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
