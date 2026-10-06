import type { Context } from 'hono';
import type { ExplainBody } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { explain } from '../resources/aiClient/requests/explain.ts';

/** Explains a highlighted word or phrase as used in its line. Not saved. */
export async function explainController(c: Context<AppEnv>) {
  const body = c.get('body') as ExplainBody; // validate(parseExplainBody) ran first
  const ms = benchmark();
  const log = scopedLogger('explain', requestId().id);

  log.info(`→ ${new Date().toISOString()}`, body);
  try {
    const result = await explain(body);
    log.info(`← ${ms()}ms`, result);
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    return fail(c, 502, 'provider-failed', 'Explaining failed');
  }
}
