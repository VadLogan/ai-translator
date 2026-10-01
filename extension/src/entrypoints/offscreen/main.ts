import { browser } from 'wxt/browser';
import { applyEvent, emptyTranscript, isComplete, liveText, type LiveTranscript } from '../../core/liveTranscript';
import { toPcm16Base64 } from '../../core/pcm';
import type { RecorderMessage, RecorderReply, VoiceLevel, VoiceOwner } from '../../messaging/recorder';

/**
 * The one microphone recorder, for the popup and every tab alike. It lives here, not in a page or
 * the worker: the worker has no getUserMedia, and a content script would ask each site for the mic.
 * An offscreen document can't show the permission prompt, so the grant comes once from the options
 * page (`options.html#mic`); without it getUserMedia rejects at once and we answer `mic-blocked`.
 *
 * Two things run off one mic: the file (MediaRecorder), which POST /transcribe takes when all else
 * fails, and the live session -- 24 kHz PCM streamed to OpenAI's Realtime API with the secret the
 * worker mints (`live`), whose text deltas ride the level ticks so the user reads along. Audio
 * from before the socket opens is buffered, so the first words aren't lost.
 */

// ponytail: a hard cap instead of silence detection; the recording simply ends here.
const MAX_SECONDS = 60;
// How often the level meter is told, and how loud speech reads: an RMS of ~0.1 (normal speech) fills the bars.
const LEVEL_EVERY_MS = 100;
const LEVEL_GAIN = 10;
// Quieter than this (on the 0..1 level) counts as silence; this long of it, from the start or the
// last sound, ends the dictation (the UIs press Stop). Raise the level if room noise keeps it going.
const SILENCE_LEVEL = 0.08;
const SILENCE_MS = 3000;
const REALTIME_URL = 'wss://api.openai.com/v1/realtime?intent=transcription';
// After Stop: how long a still-connecting socket may take to open, then the final transcript to land (~0.8 s typical).
const OPEN_WAIT_MS = 1500;
const FINISH_WAIT_MS = 3000;

interface Live {
  socket: WebSocket | null;
  /** PCM frames recorded before the socket opened. */
  pending: string[];
  transcript: LiveTranscript;
}

let recording: { recorder: MediaRecorder; chunks: Blob[]; stopped: Promise<void>; timer: number; tap: () => void; live: Live } | null = null;
// One message at a time: getUserMedia can take seconds on a cold mic, and a Stop pressed meanwhile must find the recording.
let queue: Promise<unknown> = Promise.resolve();

browser.runtime.onMessage.addListener((message: RecorderMessage, _sender, sendResponse) => {
  // Every runtime message reaches every extension page, content-script ones included.
  if (message?.target !== 'offscreen') return;
  const reply = queue.then(() => handle(message)).catch((): RecorderReply => ({ error: 'mic-failed' }));
  queue = reply;
  reply.then(sendResponse);
  return true;
});

async function handle(message: RecorderMessage): Promise<RecorderReply> {
  switch (message.type) {
    case 'start': {
      release(); // a new start wins over a recording nobody stopped
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        return { error: error instanceof DOMException && error.name === 'NotAllowedError' ? 'mic-blocked' : 'mic-failed' };
      }
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
      recorder.start();
      const live: Live = { socket: null, pending: [], transcript: emptyTranscript() };
      const stopTap = tap(stream, message.owner, live);
      const timer = window.setTimeout(() => {
        stopTap(); // the bars, the clock and the stream stop with it
        if (recorder.state === 'recording') recorder.stop();
      }, MAX_SECONDS * 1000);
      recording = { recorder, chunks, stopped, timer, tap: stopTap, live };
      return {};
    }
    case 'live': {
      // A Stop that came first already took the file: nothing left to stream.
      if (!recording || recording.live.socket || !message.secret) return {};
      const { live } = recording;
      const socket = new WebSocket(REALTIME_URL, ['realtime', `openai-insecure-api-key.${message.secret}`]);
      live.socket = socket;
      socket.onopen = () => live.pending.splice(0).forEach((audio) => append(socket, audio));
      socket.onmessage = (event) => (live.transcript = applyEvent(live.transcript, JSON.parse(event.data)));
      socket.onerror = () => (live.transcript = { ...live.transcript, failed: true });
      return {};
    }
    case 'stop': {
      if (!recording) return { error: 'mic-failed' };
      const { recorder, chunks, stopped, live } = recording;
      recording.tap(); // no more frames: what was said so far is all there is
      if (recorder.state !== 'inactive') recorder.stop();
      await stopped;
      const text = await finish(live);
      release();
      // A data: url, because runtime messages are JSON and a Blob would not survive them.
      return { audio: await dataUrl(new Blob(chunks, { type: recorder.mimeType })), ...(text ? { text } : {}) };
    }
    case 'cancel':
      release();
      return {};
  }
}

/** The live session's final text: commit the audio, wait for its transcript. Undefined = use the file. */
async function finish(live: Live): Promise<string | undefined> {
  const { socket } = live;
  if (!socket || !(await opened(socket))) return undefined;
  live.pending.splice(0).forEach((audio) => append(socket, audio));
  socket.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
  const deadline = Date.now() + FINISH_WAIT_MS;
  while (Date.now() < deadline && !live.transcript.failed && !isComplete(live.transcript)) await sleep(50);
  return isComplete(live.transcript) ? liveText(live.transcript) || undefined : undefined;
}

async function opened(socket: WebSocket): Promise<boolean> {
  const deadline = Date.now() + OPEN_WAIT_MS;
  while (socket.readyState === WebSocket.CONNECTING && Date.now() < deadline) await sleep(50);
  return socket.readyState === WebSocket.OPEN;
}

const append = (socket: WebSocket, audio: string) => socket.send(JSON.stringify({ type: 'input_audio_buffer.append', audio }));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Stops the mic (the tab's red dot goes away), the live session, and drops whatever was recorded. */
function release() {
  if (!recording) return;
  clearTimeout(recording.timer);
  recording.tap();
  if (recording.recorder.state !== 'inactive') recording.recorder.stop();
  recording.recorder.stream.getTracks().forEach((track) => track.stop());
  recording.live.socket?.close();
  recording = null;
}

/**
 * Taps the mic at 24 kHz (the Realtime API's rate; the browser resamples): every frame goes to the
 * live session (or its buffer), and every tick sends the loudness (RMS, scaled 0..1), the elapsed
 * time and the live text so far. Stopped by the returned function.
 */
function tap(stream: MediaStream, owner: VoiceOwner | undefined, live: Live): () => void {
  const context = new AudioContext({ sampleRate: 24000 });
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  // ponytail: ScriptProcessorNode is deprecated, but an AudioWorklet needs its own module file
  // under the extension's CSP. Move to one if Chrome ever drops it.
  const processor = context.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (event) => {
    const audio = toPcm16Base64(event.inputBuffer.getChannelData(0));
    if (live.socket?.readyState === WebSocket.OPEN) append(live.socket, audio);
    else if (!live.transcript.failed) live.pending.push(audio); // bounded by MAX_SECONDS
  };
  source.connect(processor);
  processor.connect(context.destination); // a processor only runs when connected; it writes silence
  const samples = new Float32Array(analyser.fftSize);
  const started = Date.now();
  let lastSound = started;
  const tick = window.setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, x) => sum + x * x, 0) / samples.length);
    const loudness = Math.min(1, rms * LEVEL_GAIN);
    const now = Date.now();
    if (loudness >= SILENCE_LEVEL) lastSound = now;
    const text = liveText(live.transcript);
    const silent = now - lastSound >= SILENCE_MS;
    const level: VoiceLevel = { type: 'voice-level', level: loudness, ms: now - started, ...(text ? { text } : {}), ...(silent ? { silent } : {}), ...(owner ? { owner } : {}) };
    browser.runtime.sendMessage(level).catch(() => {}); // nobody listening: the popup closed
  }, LEVEL_EVERY_MS);
  return () => {
    clearInterval(tick);
    processor.onaudioprocess = null;
    if (context.state !== 'closed') void context.close();
  };
}

const dataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
