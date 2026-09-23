import type { Context } from 'hono';
import type { RewriteBody } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, waitUntil, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { rewrite } from '../resources/aiClient/requests/rewrite.ts';
import { rewritesRepository, type RewriteRecord } from '../repositories/rewrites.ts';

/** Returns the selection rewritten in the requested style (natural / formal), in the same language. */
export async function rewriteController(c: Context<AppEnv>) {
  const body = c.get('body') as RewriteBody; // validate(parseRewriteBody) ran first
  const userId = c.get('userId'); // requireUser ran first
  const { rowId, id } = requestId();
  const ms = benchmark();
  const log = scopedLogger('rewrite', id);

  // Not awaited: saving must not slow down or fail the request.
  const save = (outcome: Pick<RewriteRecord, 'result' | 'error'>) =>
    waitUntil(
      rewritesRepository
        .save({ id: rowId, userId, request: body, ...outcome, durationMs: ms() })
        .catch((dbError) => log.error('db save failed', dbError)),
    );

  log.info(`→ ${new Date().toISOString()}`, body);
  try {
    const result = await rewrite(body);
    log.info(`← ${ms()}ms`, result);
    save({ result });
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    save({ error });
    return fail(c, 502, 'provider-failed', 'Rewrite failed');
  }
}
