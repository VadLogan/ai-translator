import type { VoiceClientEvent, VoiceServerEvent } from '../../../shared/contract.ts';
import { benchmark, requestId } from '../utils/http.ts';
import { verifyTicket } from '../utils/voiceTicket.ts';
import { scopedLogger } from '../resources/logger.ts';
import { appendAudio, commitAudio, openLiveTranscription } from '../resources/aiClient/requests/liveTranscribe.ts';
import { applyEvent, emptyTranscript, isComplete, liveText } from '../resources/aiClient/requests/liveTranscribe/utils/liveTranscript.ts';

/** The standard WebSocket subset both runtimes hand us (Deno.upgradeWebSocket, the `ws` package). */
export interface SocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  addEventListener(type: 'open' | 'close' | 'error', listener: () => void): void;
}

const OPEN = 1;
/** Closes a socket whose ticket is missing, forged or expired (4000-4999 is the application's range). */
export const BAD_TICKET = 4401;

const opened = (socket: SocketLike) => (socket.readyState === OPEN ? Promise.resolve() : new Promise<void>((resolve) => socket.addEventListener('open', resolve)));
const parse = (data: unknown): unknown => {
  try {
    return JSON.parse(String(data));
  } catch {
    return null;
  }
};

/**
 * Live dictation: relays the client's audio to the provider's live transcription and sends back
 * our own events (`VoiceServerEvent`), so a client never learns who transcribes. The client's audio
 * is buffered until the provider socket opens. One session per socket; either side closing ends it.
 * Logs the session, never its audio or text.
 */
export async function voiceStream(client: SocketLike, ticket: string | null): Promise<void> {
  const ms = benchmark();
  const log = scopedLogger('voice', requestId().id);
  const user = ticket ? await verifyTicket(ticket) : null;
  await opened(client);
  if (!user) return client.close(BAD_TICKET, 'Invalid or expired ticket');

  const send = (event: VoiceServerEvent) => client.readyState === OPEN && client.send(JSON.stringify(event));
  let provider: WebSocket | null = null;
  let ended = false;
  const pending: string[] = [];
  const toProvider = (message: string) => (provider?.readyState === OPEN ? provider.send(message) : pending.push(message));
  const end = (event?: VoiceServerEvent) => {
    if (ended) return;
    ended = true;
    if (event) send(event);
    client.close(1000);
    provider?.close();
  };

  log.info(`→ ${new Date().toISOString()}`, { user });
  let committed = false;
  client.addEventListener('message', ({ data }) => {
    const event = parse(data) as VoiceClientEvent | null;
    if (event?.type === 'audio' && typeof event.audio === 'string') toProvider(appendAudio(event.audio));
    if (event?.type === 'commit') {
      committed = true;
      toProvider(commitAudio());
    }
  });
  client.addEventListener('close', () => end());
  send({ type: 'ready' });

  let model: string;
  try {
    ({ socket: provider, model } = await openLiveTranscription());
  } catch (error) {
    log.error(`✗ ${ms()}ms`, error);
    return end({ type: 'error', message: 'Live voice input is unavailable' });
  }
  if (ended) return provider.close(); // the client left while the session was being opened

  let transcript = emptyTranscript();
  provider.addEventListener('open', () => pending.splice(0).forEach((message) => provider?.send(message)));
  provider.addEventListener('message', ({ data }) => {
    const before = liveText(transcript);
    transcript = applyEvent(transcript, parse(data) as Parameters<typeof applyEvent>[1]);
    if (transcript.failed) {
      log.error(`✗ ${ms()}ms`, 'transcription failed');
      return end({ type: 'error', message: 'Transcription failed' });
    }
    const text = liveText(transcript);
    if (text !== before) send({ type: 'text', text });
    if (committed && isComplete(transcript)) {
      log.info(`← ${ms()}ms`, { model, words: text ? text.split(/\s+/).length : 0 });
      end({ type: 'done', text, model });
    }
  });
  provider.addEventListener('error', () => end({ type: 'error', message: 'Live voice input is unavailable' }));
  provider.addEventListener('close', () => end({ type: 'error', message: 'Live voice input ended' }));
}
