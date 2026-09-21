import type { Context } from 'hono';
import type { DetectBody } from '../../../shared/contract.ts';
import type { AppEnv } from '../http.ts';
import { detectLang } from '../detect.ts';
import { detectionsRepository } from '../repositories/detections.ts';
import { startAttempt } from './attempt.ts';

/**
 * Asked for when the in-page menu opens, before a target language is picked, so the widget can
 * show what the selection is written in. The row's `verified` column is written later, by the
 * translate controller.
 */
export function detectController(c: Context<AppEnv>) {
  const body = c.get('body') as DetectBody; // validate(parseDetectBody) ran first

  return startAttempt('detect').run(c, {
    request: body,
    call: detectLang,
    repository: detectionsRepository,
    failure: 'Language detection failed',
  });
}
