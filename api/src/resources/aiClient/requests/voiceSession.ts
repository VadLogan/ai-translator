import { LIVE_TRANSCRIBE_MODEL, client } from '../client.ts';
import { DICTATION_PROMPT } from './dictationPrompt.ts';

// Long enough to open the socket; the session itself outlives the secret.
const SECRET_SECONDS = 120;

/**
 * The provider's secret for one live transcription session: 24 kHz PCM in, text deltas out while
 * the user speaks (gpt-live-transcribe: the first words ~1.2 s in). Only the API uses it --
 * `liveTranscribe.ts` opens the socket with it; it never reaches a client. No turn detection: the
 * live models refuse it, and the client commits the audio on Stop, so a dictation is one item.
 */
export async function voiceSession(): Promise<{ secret: string; expiresAt: number; model: string }> {
  const response = await client.realtime.clientSecrets.create({
    expires_after: { anchor: 'created_at', seconds: SECRET_SECONDS },
    session: {
      type: 'transcription',
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24000 },
          transcription: { model: LIVE_TRANSCRIBE_MODEL, prompt: DICTATION_PROMPT },
          noise_reduction: { type: 'near_field' },
          turn_detection: null,
        },
      },
    },
  });
  return { secret: response.value, expiresAt: response.expires_at, model: LIVE_TRANSCRIBE_MODEL };
}
