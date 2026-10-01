import type { Context } from 'hono';
import type { TranscribeBody, TranscribeOk } from '../../../shared/contract.ts';
import { benchmark, fail, requestId, waitUntil, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { transcribe } from '../resources/aiClient/requests/transcribe.ts';
import { detectLang } from '../resources/aiClient/requests/detect.ts';
import { transcriptionsRepository, type TranscriptionRecord } from '../repositories/transcriptions.ts';

// Off for now: dictations are not stored. The table (migration) and repository are ready; flip to true to save them.
const SAVE_TRANSCRIPTIONS = false;

/**
 * Voice input: the audio to text, then its language in the same request, so the client branches
 * (grammar fix / translate) without a /detect round trip. No guardText: speech can't be typed on
 * the wrong keyboard layout.
 */
export async function transcribeController(c: Context<AppEnv>) {
  const body = c.get('body') as TranscribeBody; // validate(parseTranscribeBody) ran first
  const userId = c.get('userId'); // requireUser ran first
  const { rowId, id } = requestId();
  const ms = benchmark();
  const log = scopedLogger('transcribe', id);

  // Not awaited: saving must not slow down or fail the request.
  const save = (outcome: Pick<TranscriptionRecord, 'result' | 'error'>) =>
    SAVE_TRANSCRIPTIONS && waitUntil(
      transcriptionsRepository
        .save({ id: rowId, userId, request: body, ...outcome, durationMs: ms() })
        .catch((dbError) => log.error('db save failed', dbError)),
    );

  log.info(`→ ${new Date().toISOString()}`, { bytes: body.audio.size, type: body.audio.type, url: body.url });
  try {
    const { text, model } = await transcribe(body.audio);
    const result: TranscribeOk = { text, lang: text ? (await detectLang({ text })).lang : 'und', model };
    log.info(`← ${ms()}ms`, result);
    save({ result });
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    save({ error });
    return fail(c, 502, 'provider-failed', 'Voice input failed');
  }
}
