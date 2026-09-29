import { choice } from '@typesafe-ai/sdk';
import { typeSafeClient } from '../client.ts';

export type GuardVerdict = 'mistyped' | 'gibberish';

/**
 * Whether the text is a language at all: typed on the wrong keyboard layout (`ghbdtn` for
 * `привет`), random keystrokes (`adfasdf`), or real text (null). Runs before every provider call.
 */
export async function validateGuard(text: string, signal?: AbortSignal): Promise<GuardVerdict | null> {
  const { answers } = await typeSafeClient.systemOne(
    {
      state: { document: text },
      questions: {
        verdict: choice('What is this text?', {
          mistyped: 'Typed with the wrong keyboard layout active: the keystrokes of one script rendered in another',
          gibberish: 'Random, meaningless keystrokes that are no language on either keyboard layout',
          text: 'Real text in some language, a sentence or part of one; names, code, urls, abbreviations and short interjections count',
        }),
      },
    },
    { signal },
  );
  const verdict = answers.verdict.choice;
  return verdict === 'text' ? null : verdict;
}
