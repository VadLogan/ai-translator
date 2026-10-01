import { choice } from '@typesafe-ai/sdk';
import { typeSafeClient } from '../client.ts';

export type GuardVerdict = 'mistyped' | 'gibberish';

export const GUARD_MESSAGES = {
  mistyped: 'Typed on the wrong keyboard layout',
  gibberish: "This doesn't look like text",
} as const;

/** The guard's question, shared with grammarQuality, which asks it in the same call as its count. */
export const verdictQuestion = choice('What is this text?', {
  mistyped: 'Typed with the wrong keyboard layout active: the keystrokes of one script rendered in another',
  gibberish: 'Random, meaningless keystrokes that are no language on either keyboard layout',
  text: 'Real text in some language, a sentence or part of one; names, code, urls, abbreviations and short interjections count',
});

export const toVerdict = (choice: string): GuardVerdict | null => (choice === 'text' ? null : (choice as GuardVerdict));

/**
 * Whether the text is a language at all: typed on the wrong keyboard layout (`ghbdtn` for
 * `привет`), random keystrokes (`adfasdf`), or real text (null). Runs before every provider call.
 */
export async function validateGuard(text: string, signal?: AbortSignal): Promise<GuardVerdict | null> {
  const { answers } = await typeSafeClient.systemOne(
    { state: { document: text }, questions: { verdict: verdictQuestion } },
    { signal },
  );
  return toVerdict(answers.verdict.choice);
}
