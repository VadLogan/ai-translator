/** Words, whitespace runs and single punctuation marks: the units an edit is measured in. */
export const tokenize = (s: string) => s.match(/\s+|[\p{L}\p{N}\p{M}_'’-]+|[^\s\p{L}\p{N}\p{M}]/gu) ?? [];
