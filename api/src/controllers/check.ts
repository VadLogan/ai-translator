import type { Context } from 'hono';
import type { CheckBody } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { grammarQuality } from '../resources/aiClient/requests/grammarQuality.ts';

/**
 * The background check behind the field icon's badge: how many errors, not what they are. The fix
 * itself (/fix-grammar) is only asked when the icon is clicked. Not saved: there is no table for it.
 */
export async function checkController(c: Context<AppEnv>) {
  const body = c.get('body') as CheckBody; // validate(parseDetectBody) ran first
  const { id } = requestId();
  const ms = benchmark();
  const log = scopedLogger('check', id);

  log.info(`→ ${new Date().toISOString()}`, body);
  try {
    const result = await grammarQuality(body.text, c.req.raw.signal); // the client cancels checks for text it edited
    log.info(`← ${ms()}ms`, result);
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    return fail(c, 502, 'provider-failed', 'Grammar check failed');
  }
}
