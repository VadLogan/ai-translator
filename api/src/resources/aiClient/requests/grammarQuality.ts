import { choice } from '@typesafe-ai/sdk';
import type { CheckOk } from '../../../../../shared/contract.ts';
import { typeSafeClient } from '../client.ts';
import { toVerdict, verdictQuestion, type GuardVerdict } from './validateGuard.ts';

// "0".."9"; the last one stands for 9 or more.
const COUNTS = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i), i === 9 ? '9 or more' : null]));

/**
 * Counts the grammar, spelling and punctuation errors without fixing them: the badge's number.
 * Asks the guard's question in the same call (one round trip, not two): `verdict` is what
 * validateGuard would have answered, so /check runs without guardText.
 */
export async function grammarQuality(text: string, signal?: AbortSignal): Promise<CheckOk & { verdict: GuardVerdict | null }> {
  const response = await typeSafeClient.systemOne(
    {
      state: { document: text },
      questions: {
        verdict: verdictQuestion,
        errors: choice('How many grammar, spelling and punctuation errors does this text have?', COUNTS),
      },
    },
    { signal },
  );
  const { usage } = response;
  return {
    verdict: toVerdict(response.answers.verdict.choice),
    errors: Number(response.answers.errors.choice),
    model: response.model,
    usage: {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens,
    },
  };
}
