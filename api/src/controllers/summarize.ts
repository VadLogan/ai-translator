import type { Context } from 'hono';
import type { SummarizeBody } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { summarize } from '../resources/aiClient/requests/summarize.ts';

/** The key points of a meeting's dialog. Not saved. */
export async function summarizeController(c: Context<AppEnv>) {
  const body = c.get('body') as SummarizeBody; // validate(parseSummarizeBody) ran first
  const ms = benchmark();
  const log = scopedLogger('summarize', requestId().id);

  // The transcript can be long: log its size, not its text.
  log.info(`→ ${new Date().toISOString()}`, { lines: body.lines.length, targetLang: body.targetLang });
  try {
    const result = await summarize(body);
    log.info(`← ${ms()}ms`, result);
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    return fail(c, 502, 'provider-failed', 'Summarizing failed');
  }
}
