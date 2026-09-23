import type { Context } from 'hono';
import type { DetectBody } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, waitUntil, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { detectLang } from '../resources/aiClient/requests/detect.ts';
import { detectionsRepository, type DetectionRecord } from '../repositories/detections.ts';

/**
 * Asked for when the in-page menu opens, before a target language is picked, so the widget can
 * show what the selection is written in. The row's `verified` column is written later, by the
 * translate controller.
 */
export async function detectController(c: Context<AppEnv>) {
  const body = c.get('body') as DetectBody; // validate(parseDetectBody) ran first
  const userId = c.get('userId'); // requireUser ran first
  const { rowId, id } = requestId();
  const ms = benchmark();
  const log = scopedLogger('detect', id);

  // Not awaited: saving must not slow down or fail the request.
  const save = (outcome: Pick<DetectionRecord, 'result' | 'error'>) =>
    waitUntil(
      detectionsRepository
        .save({ id: rowId, userId, request: body, ...outcome, durationMs: ms() })
        .catch((dbError) => log.error('db save failed', dbError)),
    );

  log.info(`→ ${new Date().toISOString()}`, body);
  try {
    const result = await detectLang(body);
    log.info(`← ${ms()}ms`, result);
    save({ result });
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    save({ error });
    return fail(c, 502, 'provider-failed', 'Language detection failed');
  }
}
