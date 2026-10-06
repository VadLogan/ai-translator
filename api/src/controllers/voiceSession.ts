import type { Context } from 'hono';
import { fail, requestId, type AppEnv } from '../utils/http.ts';
import { signTicket } from '../utils/voiceTicket.ts';
import { scopedLogger } from '../resources/logger.ts';

/**
 * Live voice input: a short-lived ticket for the `voice` function's socket, which relays the audio
 * to the provider (controllers/voiceStream.ts). No provider call here and no secret leaves the API.
 * If this fails the client still has POST /transcribe.
 */
export async function voiceSessionController(c: Context<AppEnv>) {
  const log = scopedLogger('voice-session', requestId().id);
  const signed = await signTicket(c.get('userId')); // requireUser ran first
  if (!signed) {
    log.error('live voice input is off', 'VOICE_TICKET_SECRET is not set');
    return fail(c, 502, 'provider-failed', 'Live voice input is unavailable');
  }
  log.info('←', { expiresAt: signed.expiresAt }); // never the ticket
  return c.json(signed);
}
