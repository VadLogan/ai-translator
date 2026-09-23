import type { Context } from 'hono';
import type { FixGrammarBody } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, waitUntil, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { fixGrammar } from '../resources/aiClient/requests/fix-grammar/fix-grammar.ts';
import { correctionsRepository, type CorrectionRecord } from '../repositories/corrections.ts';

/** Returns the selection with grammar, spelling and punctuation fixed, in the same language. */
export async function fixGrammarController(c: Context<AppEnv>) {
  const body = c.get('body') as FixGrammarBody; // validate(parseDetectBody) ran first
  const userId = c.get('userId'); // requireUser ran first
  const { rowId, id } = requestId();
  const ms = benchmark();
  const log = scopedLogger('fix-grammar', id);

  // Not awaited: saving must not slow down or fail the request.
  const save = (outcome: Pick<CorrectionRecord, 'result' | 'error'>) =>
    waitUntil(
      correctionsRepository
        .save({ id: rowId, userId, request: body, ...outcome, durationMs: ms() })
        .catch((dbError) => log.error('db save failed', dbError)),
    );

  log.info(`→ ${new Date().toISOString()}`, body);
  try {
    const result = await fixGrammar(body);
    log.info(`← ${ms()}ms`, result);
    save({ result });
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    save({ error });
    return fail(c, 502, 'provider-failed', 'Grammar fix failed');
  }
}
