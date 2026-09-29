import { choice } from '@typesafe-ai/sdk';
import type { DetectBody, DetectOk } from '../../../../../shared/contract.ts';
import { LANGUAGES_MAP } from '../../../../../shared/contants.ts';
import { typeSafeClient } from '../client.ts';

/** Detection only: DetectBody in, DetectOk out. A wrong layout or gibberish never gets here (guardText). */
export async function detectLang({ text }: DetectBody): Promise<DetectOk> {
  const response = await typeSafeClient.systemOne({
    state: { document: text },
    questions: {
      lang: choice('Which language is this text written in?', LANGUAGES_MAP),
    },
  });
  const { usage } = response;
  return {
    lang: response.answers.lang.choice,
    model: response.model,
    usage: {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens,
    },
  };
}
