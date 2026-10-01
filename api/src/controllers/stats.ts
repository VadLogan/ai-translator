import type { Context } from 'hono';
import type { DictationBody } from '../../../shared/contract.ts';
import { requestId, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { wordStatsRepository } from '../repositories/wordStats.ts';

/** Dev stats: words translated, seconds and words dictated, per UTC day and in total (see repositories/wordStats.ts for where they live). */
export const statsController = (c: Context<AppEnv>) => c.json(wordStatsRepository.read());

/** One recording's length, words and model, reported by the extension after Stop. A dev counter: it answers 204 even when it can't write. */
export function dictationController(c: Context<AppEnv>) {
  const { seconds, words, model } = c.get('body') as DictationBody; // validate(parseDictationBody) ran first
  try {
    wordStatsRepository.addDictation(seconds, words, model);
  } catch (statsError) {
    scopedLogger('stats', requestId().id).error('dictation stats failed', statsError);
  }
  return c.body(null, 204);
}
