import type { ExceptionKind, VocabException } from '../../../shared/contract.ts';
import { findExceptions } from '../../../shared/exceptions.ts';

/** `{{n}}`: a mention, a link or a masked exception. */
const TOKEN = /\{\{(\d+)\}\}/g;

/**
 * Hides the user's exceptions from the model: each occurrence (`findExceptions`) becomes a `{{n}}`
 * token, numbered after the mention tokens already in the text. `restore` puts the term back, so a
 * wrong form comes back spelled as the term.
 */
export function mask(text: string, exceptions?: VocabException[], kinds?: readonly ExceptionKind[]) {
  let n = Math.max(0, ...[...text.matchAll(TOKEN)].map((m) => Number(m[1])));
  const terms = new Map<string, string>();
  let masked = '';
  let at = 0;
  for (const { start, end, term } of findExceptions(text, exceptions, kinds)) {
    terms.set(String(++n), term);
    masked += `${text.slice(at, start)}{{${n}}}`;
    at = end;
  }
  return {
    text: masked + text.slice(at),
    /** The model's output with the masked terms back; a mention token is left for the client. */
    restore: (out: string) => out.replace(TOKEN, (token, k: string) => terms.get(k) ?? token),
  };
}

/** The tokens in a text, sorted: an edit that changes them would drop or move a kept term. */
export const tokensOf = (text: string) => [...text.matchAll(TOKEN)].map((m) => m[0]).sort().join();
