import type { Context } from 'hono';
import type { FixGrammarBody } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, waitUntil, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { fixGrammar } from '../resources/aiClient/requests/fix-grammar/fix-grammar.ts';
import { GUARD_MESSAGES, validateGuard } from '../resources/aiClient/requests/validateGuard.ts';
import { correctionsRepository, type CorrectionRecord } from '../repositories/corrections.ts';

/**
 * Returns the selection with grammar, spelling and punctuation fixed, in the same language.
 * Guards itself, in parallel with the fix rather than before it (the client fixes paragraph by
 * paragraph with no /check first): a verdict aborts the fix and 422s like guardText would. Fails
 * open like guardText. `guarded: true` skips it: a /check of this exact text already guarded it.
 */
export async function fixGrammarController(c: Context<AppEnv>) {
  const body = c.get('body') as FixGrammarBody; // validate(parseDetectBody) ran first
  const userId = c.get('userId'); // requireUser ran first
  const { rowId, id } = requestId();
  const ms = benchmark();
  const log = scopedLogger('fix-grammar', id);

  // Disabled for now, both outcomes (calls commented below).
  // Not awaited: saving must not slow down or fail the request.
  const save = (outcome: Pick<CorrectionRecord, 'result' | 'error'>) =>
    waitUntil(
      correctionsRepository
        .save({ id: rowId, userId, request: body, ...outcome, durationMs: ms() })
        .catch((dbError) => log.error('db save failed', dbError)),
    );

  log.info(`→ ${new Date().toISOString()}`, body);
  try {
    const fixing = new AbortController(); // the client cancels fixes for text it edited; a verdict cancels it too
    c.req.raw.signal.addEventListener('abort', () => fixing.abort(), { once: true });
    const guard = body.guarded
      ? null
      : validateGuard(body.text, c.req.raw.signal)
          .then((verdict) => (verdict && fixing.abort(), verdict))
          .catch((error) => (log.error('guard failed, letting the text through', error), null));
    const [verdict, result] = await Promise.all([guard, fixGrammar(body, fixing.signal).catch((error) => error as Error)]);
    if (verdict) return fail(c, 422, verdict, GUARD_MESSAGES[verdict]);
    if (result instanceof Error) throw result;
    log.info(`← ${ms()}ms`, result);
   // save({ result });
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    // save({ error });
    return fail(c, 502, 'provider-failed', 'Grammar fix failed');
  }
}
