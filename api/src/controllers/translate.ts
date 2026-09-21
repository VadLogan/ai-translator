import type { Context } from 'hono';
import type { TranslateBody } from '../../../shared/contract.ts';
import { waitUntil, type AppEnv } from '../http.ts';
import { translate } from '../translate.ts';
import { translationsRepository } from '../repositories/translations.ts';
import { detectionsRepository } from '../repositories/detections.ts';
import { startAttempt } from './attempt.ts';

export function translateController(c: Context<AppEnv>) {
  const body = c.get('body') as TranslateBody; // validate(parseTranslateBody) ran first
  const attempt = startAttempt('translate');

  // What the client translated with is the only verdict we get on the detection it was given:
  // same language = the user accepted it, a different one = the user corrected it.
  if (body.sourceLang) {
    waitUntil(
      detectionsRepository
        .verify(c.get('userId'), body.text, body.sourceLang)
        .catch((dbError) => attempt.error('detection verify failed', dbError)),
    );
  }

  return attempt.run(c, {
    request: body,
    call: translate,
    repository: translationsRepository,
    failure: 'Translation provider failed',
  });
}
