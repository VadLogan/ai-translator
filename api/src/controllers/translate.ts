import type { Context } from 'hono';
import type { TranslateBody } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, waitUntil, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { translate } from '../resources/aiClient/requests/translate.ts';
import { translationsRepository, type TranslationRecord } from '../repositories/translations.ts';
import { detectionsRepository } from '../repositories/detections.ts';

export async function translateController(c: Context<AppEnv>) {
  const body = c.get('body') as TranslateBody; // validate(parseTranslateBody) ran first
  const userId = c.get('userId'); // requireUser ran first
  const { rowId, id } = requestId();
  const ms = benchmark();
  const log = scopedLogger('translate', id);

  // Not awaited: saving must not slow down or fail the request.
  const save = (outcome: Pick<TranslationRecord, 'result' | 'error'>) =>
    waitUntil(
      translationsRepository
        .save({ id: rowId, userId, request: body, ...outcome, durationMs: ms() })
        .catch((dbError) => log.error('db save failed', dbError)),
    );

  // What the client translated with is the only verdict we get on the detection it was given:
  // same language = the user accepted it, a different one = the user corrected it.
  if (body.sourceLang) {
    waitUntil(
      detectionsRepository
        .verify(userId, body.text, body.sourceLang)
        .catch((dbError) => log.error('detection verify failed', dbError)),
    );
  }

  log.info(`→ ${new Date().toISOString()}`, body);
  try {
    const result = await translate(body);
    log.info(`← ${ms()}ms`, result);
    save({ result });
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    save({ error });
    return fail(c, 502, 'provider-failed', 'Translation provider failed');
  }
}
