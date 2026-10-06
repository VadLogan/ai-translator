import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openLiveTranscription } from '../resources/aiClient/requests/liveTranscribe.ts';
import { signTicket } from '../utils/voiceTicket.ts';
import { BAD_TICKET, voiceStream } from './voiceStream.ts';

vi.mock('../resources/aiClient/requests/liveTranscribe.ts', async (original) => ({
  ...(await original<typeof import('../resources/aiClient/requests/liveTranscribe.ts')>()),
  openLiveTranscription: vi.fn(),
}));
// liveTranscribe.ts imports the provider client, which needs a key at load.
vi.mock('../resources/aiClient/requests/voiceSession.ts', () => ({ voiceSession: vi.fn() }));

/** A socket either runtime could hand us, with the test pulling the strings. */
class FakeSocket {
  readyState = 1;
  sent: unknown[] = [];
  closed: number | undefined;
  private listeners: Record<string, ((event: { data: unknown }) => void)[]> = {};
  addEventListener(type: string, listener: (event: { data: unknown }) => void) {
    (this.listeners[type] ??= []).push(listener);
  }
  emit(type: string, data?: unknown) {
    for (const listener of this.listeners[type] ?? []) listener({ data: typeof data === 'string' || data === undefined ? data : JSON.stringify(data) });
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close(code = 1000) {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.closed = code;
    this.emit('close');
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('voiceStream', () => {
  let provider: FakeSocket;
  beforeEach(() => {
    process.env.VOICE_TICKET_SECRET = 'test-secret';
    provider = new FakeSocket();
    provider.readyState = 0; // connecting
    vi.mocked(openLiveTranscription).mockResolvedValue({ socket: provider as unknown as WebSocket, model: 'live-model' });
  });
  const ticket = async () => (await signTicket('user-1'))!.ticket;

  it('refuses a missing or forged ticket without opening a session', async () => {
    for (const bad of [null, 'forged.ticket']) {
      const client = new FakeSocket();
      await voiceStream(client, bad);
      expect(client.closed).toBe(BAD_TICKET);
    }
    expect(openLiveTranscription).not.toHaveBeenCalled();
  });

  it('buffers audio until the provider opens, relays the text, and ends with done on commit', async () => {
    const client = new FakeSocket();
    await voiceStream(client, await ticket());
    expect(client.sent).toEqual([{ type: 'ready' }]);

    client.emit('message', { type: 'audio', audio: 'AAA' });
    expect(provider.sent).toEqual([]);
    provider.readyState = 1;
    provider.emit('open');
    expect(provider.sent).toEqual([{ type: 'input_audio_buffer.append', audio: 'AAA' }]);

    provider.emit('message', { type: 'conversation.item.input_audio_transcription.delta', item_id: 'i1', delta: 'Hello wor' });
    expect(client.sent.at(-1)).toEqual({ type: 'text', text: 'Hello wor' });

    client.emit('message', { type: 'commit' });
    expect(provider.sent.at(-1)).toEqual({ type: 'input_audio_buffer.commit' });
    provider.emit('message', { type: 'conversation.item.input_audio_transcription.completed', item_id: 'i1', transcript: 'Hello world.' });
    expect(client.sent.at(-1)).toEqual({ type: 'done', text: 'Hello world.', model: 'live-model' });
    expect(client.closed).toBe(1000);
    expect(provider.closed).toBe(1000);
  });

  it('turns a provider failure into an error event and closes', async () => {
    const client = new FakeSocket();
    await voiceStream(client, await ticket());
    provider.emit('message', { type: 'error', error: { message: 'quota' } });
    expect(client.sent.at(-1)).toEqual({ type: 'error', message: 'Transcription failed' });
    expect(client.closed).toBe(1000);
  });

  it('reports a session that could not be opened', async () => {
    vi.mocked(openLiveTranscription).mockRejectedValueOnce(new Error('mint failed'));
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const client = new FakeSocket();
    await voiceStream(client, await ticket());
    expect(client.sent.at(-1)).toEqual({ type: 'error', message: 'Live voice input is unavailable' });
  });

  it('closes the provider when the client leaves', async () => {
    const client = new FakeSocket();
    await voiceStream(client, await ticket());
    client.close();
    await flush();
    expect(provider.closed).toBe(1000);
  });
});
