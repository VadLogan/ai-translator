import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import { sendMessage } from '../../../messaging/messages';
import { isVoiceLevel } from '../../../messaging/recorder';
import { liveLanguage } from '../../../core/liveLanguage';
import { sentenceFixes } from '../../../core/sentenceFixes';

/**
 * The popup's voice input, through the worker's offscreen recorder: idle → listening → transcribing.
 * `onText` gets what was said and its language. Closing the popup mid-recording releases the mic
 * (pagehide); ↵ stops it, like the in-page widget, and so do 3 s of silence (the recorder's `silent`).
 */
export function useDictation(callbacks: {
  onText(text: string, lang: string): void;
  /** The live text at Stop, shown at once while the final transcript (~0.8 s) is on its way. */
  onPreview(text: string): void;
  onError(message: string): void;
}) {
  // The listeners below are subscribed once; they reach the latest callbacks (and their history) through this.
  const latest = useRef(callbacks);
  latest.current = callbacks;
  // `finishing`: stopped with the live text already shown; the final transcript is on its way (no card).
  const [state, setState] = useState<'idle' | 'listening' | 'transcribing' | 'finishing'>('idle');
  // The live text's language, asked while the user speaks, so Stop needs no "Transcribing…" card.
  const [liveLang] = useState(() => liveLanguage(async (text) => {
    const answer = await sendMessage({ type: 'detect', text });
    return answer.ok ? answer.data.lang : undefined;
  }));
  // The recorder's level meter and live text: the popup is an extension page, so it hears the recorder directly.
  const [meter, setMeter] = useState<{ level: number; seconds: number; text?: string }>({ level: 0, seconds: 0 });
  const live = useRef(state);
  live.current = state;
  const meterText = useRef<string>(undefined);
  // An English dictation's grammar fix, made sentence by sentence while it is spoken; useGrammarFix finishes it.
  const [fixer] = useState(() =>
    sentenceFixes((text, id) => sendMessage({ type: 'fix-grammar', text, id }), (id) => void sendMessage({ type: 'cancel', id })),
  );

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
      liveLang.feed(message.text);
      if (liveLang.lang === 'en') fixer.feed(message.text);
      meterText.current = message.text;
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
    meterText.current = undefined;
    liveLang.reset();
    fixer.reset();
    setState('listening');
    const response = await sendMessage({ type: 'voice-start' });
    if (response.ok) return;
    setState('idle');
    latest.current.onError(response.error.message);
  };

  async function stop() {
    if (live.current !== 'listening') return; // ↵, a click and the silence can all ask at once
    const lang = liveLang.lang;
    const early = meterText.current && lang ? meterText.current : undefined;
    const next = early ? 'finishing' : 'transcribing';
    live.current = next;
    setState(next);
    if (early) latest.current.onPreview(early);
    const response = await sendMessage({ type: 'voice-stop', ...(early ? { lang } : {}) });
    if (live.current !== next) return; // cancelled meanwhile
    setState('idle');
    if (!response.ok) return latest.current.onError(response.error.message);
    if (!response.data.text) return latest.current.onError("Didn't catch that. Try again.");
    latest.current.onText(response.data.text, response.data.lang);
  }

  const cancel = () => {
    setState('idle');
    void sendMessage({ type: 'voice-cancel' });
  };

  return { state, ...meter, fixer, start: () => void start(), stop: () => void stop(), cancel };
}
