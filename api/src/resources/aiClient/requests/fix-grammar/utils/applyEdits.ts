/**
 * The corrected text, built by applying the model's `original → replacement` pairs to the input in
 * order, so the model never has to write the whole text back. Each `original` is searched from the
 * end of the previous one; an edit whose `original` isn't there (or is empty) is dropped.
 */
export function applyEdits(text: string, edits: { original: string; replacement: string }[]): string {
  let out = '';
  let cursor = 0;
  for (const { original, replacement } of edits) {
    const at = original ? text.indexOf(original, cursor) : -1;
    // ponytail: a misquoted edit is lost, not retried; re-ask with the full text if drops show up in the logs.
    if (at < 0) continue;
    out += text.slice(cursor, at) + replacement;
    cursor = at + original.length;
  }
  return out + text.slice(cursor);
}
