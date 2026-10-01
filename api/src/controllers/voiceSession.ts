import type { Context } from 'hono';
import { benchmark, fail, requestId, type AppEnv } from '../utils/http.ts';
import { scopedLogger } from '../resources/logger.ts';
import { voiceSession } from '../resources/aiClient/requests/voiceSession.ts';

/**
 * Live voice input: a short-lived secret the extension opens a Realtime transcription socket with,
 * so the user sees the words while speaking. The audio goes to OpenAI directly; nothing is saved.
 * If this fails the extension still has POST /transcribe.
 */
export async function voiceSessionController(c: Context<AppEnv>) {
  const { id } = requestId();
  const ms = benchmark();
  const log = scopedLogger('voice-session', id);
  log.info(`→ ${new Date().toISOString()}`);
  try {
    const result = await voiceSession();
    log.info(`← ${ms()}ms`, { model: result.model, expiresAt: result.expiresAt }); // never the secret
    return c.json(result);
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    return fail(c, 502, 'provider-failed', 'Live voice input is unavailable');
  }
}
