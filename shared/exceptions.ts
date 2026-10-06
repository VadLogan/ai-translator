import { EXCEPTION_KINDS, type ExceptionKind, type VocabException } from './contract.ts';

/** How alike a word must be to a term or wrong form (ignoring case) to count as a wrong form of it: 1 - edits / longer length. */
export const SIMILAR = 0.8;

/** One whole-word occurrence of an exception in a text. `wrong`: a `replaces` form or a near miss, not the term itself. */
export interface ExceptionHit {
  start: number;
  end: number;
  term: string;
  kind: ExceptionKind;
  wrong: boolean;
}

/**
 * Where the user's exceptions occur: each term (case-sensitive) or wrong form (`replaces`, any case)
 * as a whole word, never inside a `{{n}}` token. Longest forms win an overlap ("Visual Studio Code"
 * over "Visual Studio"). Then any other word at least SIMILAR to a one-word term or form
 * ("typemeans" for "Typemeant") is a wrong form too: code, not the model, decides it. In text order.
 * Shared by the API's mask, the worker's choice of what to send and the grammar panel's marks.
 */
export function findExceptions(text: string, exceptions: readonly VocabException[] = [], kinds: readonly ExceptionKind[] = EXCEPTION_KINDS): ExceptionHit[] {
  const forms = exceptions
    .filter((x) => kinds.includes(x.kind))
    .flatMap(({ term, kind, replaces }) => [
      { form: term, term, kind, wrong: false, flags: 'gu' },
      ...replaces.map((form) => ({ form, term, kind, wrong: true, flags: 'giu' })),
    ])
    .filter(({ form }) => form.trim())
    .sort((a, b) => b.form.length - a.form.length);
  const hits: ExceptionHit[] = [];
  for (const { form, flags, ...exception } of forms) {
    // Not part of a longer word, and never inside a token ({{12}} holds no "1").
    const word = new RegExp(`(?<![\\p{L}\\p{N}_{])${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_}])`, flags);
    for (const m of text.matchAll(word)) {
      const start = m.index;
      const end = start + m[0].length;
      if (!hits.some((h) => start < h.end && h.start < end)) hits.push({ start, end, ...exception });
    }
  }
  // ponytail: near misses are one word against one-word forms; multi-word terms match exactly only.
  const single = forms.filter(({ form }) => !/\s/.test(form.trim()));
  for (const m of text.matchAll(/[\p{L}\p{N}_]+/gu)) {
    const start = m.index;
    const end = start + m[0].length;
    if (text[start - 1] === '{' || hits.some((h) => start < h.end && h.start < end)) continue;
    const near = single.find(({ form }) => similarity(m[0], form) >= SIMILAR);
    if (near) hits.push({ start, end, term: near.term, kind: near.kind, wrong: true });
  }
  return hits.sort((a, b) => a.start - b.start);
}

/** 1 - Levenshtein distance / the longer length, ignoring case: 1 = the same word. */
export function similarity(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  const longer = Math.max(x.length, y.length);
  if (!longer) return 1;
  if (Math.abs(x.length - y.length) / longer > 1 - SIMILAR) return 0; // too far apart to bother
  let row = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const next = [i];
    for (let j = 1; j <= y.length; j++) next[j] = Math.min(row[j]! + 1, next[j - 1]! + 1, row[j - 1]! + (x[i - 1] === y[j - 1] ? 0 : 1));
    row = next;
  }
  return 1 - row[y.length]! / longer;
}

/** The exception a fix edit spells out: a wrong form or near miss (`jira`, `typemeans`) replaced by its term. */
export const exceptionOf = (edit: { original: string; replacement: string }, exceptions: readonly VocabException[] = []) =>
  exceptions.find((x) => {
    if (edit.replacement.trim() !== x.term) return false;
    const [hit] = findExceptions(edit.original.trim(), [x]);
    return hit?.wrong && hit.end - hit.start === edit.original.trim().length;
  });
