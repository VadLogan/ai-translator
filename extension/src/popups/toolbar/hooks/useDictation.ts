import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import { sendMessage } from '../../../messaging/messages';
import { isVoiceLevel } from '../../../messaging/recorder';

/**
 * The popup's voice input, through the worker's offscreen recorder: idle → listening → transcribing.
 * `onText` gets what was said and its language. Closing the popup mid-recording releases the mic
 * (pagehide); ↵ stops it, like the in-page widget, and so do 3 s of silence (the recorder's `silent`).
 */
export function useDictation(callbacks: { onText(text: string, lang: string): void; onError(message: string): void }) {
  // The listeners below are subscribed once; they reach the latest callbacks (and their history) through this.
  const latest = useRef(callbacks);
  latest.current = callbacks;
  const [state, setState] = useState<'idle' | 'listening' | 'transcribing'>('idle');
  // The recorder's level meter and live text: the popup is an extension page, so it hears the recorder directly.
  const [meter, setMeter] = useState<{ level: number; seconds: number; text?: string }>({ level: 0, seconds: 0 });
  const live = useRef(state);
  live.current = state;

  useEffect(() => {
    const release = () => live.current !== 'idle' && void sendMessage({ type: 'voice-cancel' });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || live.current !== 'listening') return;
      event.preventDefault();
      void stop();
    };
    // One recording at a time: while we listen, the levels are ours.
    const onLevel = (message: unknown) => {
      if (!isVoiceLevel(message) || live.current !== 'listening') return;
      if (message.silent) return void stop();
      setMeter({ level: message.level, seconds: message.ms / 1000, text: message.text });
    };
    browser.runtime.onMessage.addListener(onLevel);
    addEventListener('pagehide', release);
    addEventListener('keydown', onKey, true);
    return () => {
      browser.runtime.onMessage.removeListener(onLevel);
      removeEventListener('pagehide', release);
      removeEventListener('keydown', onKey, true);
    };
  }, []);

  const start = async () => {
    setMeter({ level: 0, seconds: 0 });
    setState('listening');
    const response = await sendMessage({ type: 'voice-start' });
    if (response.ok) return;
    setState('idle');
    latest.current.onError(response.error.message);
  };

  async function stop() {
    if (live.current !== 'listening') return; // ↵, a click and the silence can all ask at once
    live.current = 'transcribing';
    setState('transcribing');
    const response = await sendMessage({ type: 'voice-stop' });
    if (live.current !== 'transcribing') return; // cancelled meanwhile
    setState('idle');
    if (!response.ok) return latest.current.onError(response.error.message);
    if (!response.data.text) return latest.current.onError("Didn't catch that. Try again.");
    latest.current.onText(response.data.text, response.data.lang);
  }

  const cancel = () => {
    setState('idle');
    void sendMessage({ type: 'voice-cancel' });
  };

  return { state, ...meter, start: () => void start(), stop: () => void stop(), cancel };
}
