import { voiceSession } from './voiceSession.ts';

// The provider's live transcription socket; only the API knows it.
const REALTIME_URL = 'wss://api.openai.com/v1/realtime?intent=transcription';

export interface LiveTranscription {
  socket: WebSocket;
  model: string;
}

/**
 * Opens one live transcription session at the provider: mints a session secret (configured there:
 * 24 kHz PCM, the dictation prompt, no turn detection), then the socket with it. The socket may
 * still be connecting; the caller buffers until it opens. The protocol on it is the provider's
 * Realtime events -- `liveTranscribe/utils/liveTranscript.ts` reads them.
 */
export async function openLiveTranscription(): Promise<LiveTranscription> {
  const { secret, model } = await voiceSession();
  return { socket: new WebSocket(REALTIME_URL, ['realtime', `openai-insecure-api-key.${secret}`]), model };
}

/** The provider's messages for audio in and "that's all": base64 PCM16 frames, then the commit. */
export const appendAudio = (audio: string) => JSON.stringify({ type: 'input_audio_buffer.append', audio });
export const commitAudio = () => JSON.stringify({ type: 'input_audio_buffer.commit' });
