import { useEffect, useRef, useState } from 'react';
import type { ProviderId } from '../../../auth/providers';
import { findLanguage } from '../../../core/languages';
import { sendMessage } from '../../../messaging/messages';
import { defaultPair, orient, pairFor, topPairs, type HistoryEntry, type Pair } from '../../../settings/history';

type Notice = { message: string; isError: boolean };

interface Options {
  favorites: readonly string[];
  history: readonly HistoryEntry[];
  /** Saves a new translation to history. */
  remember(entry: HistoryEntry): Promise<void>;
}

/**
 * Home's translator: the text, the language pair (picked, detected, or from history), the answer
 * with its "Try another" versions, and the notice / sign-in line under the button.
 */
export function useTranslation({ favorites, history, remember }: Options) {
  const [text, setText] = useState('');
  // A source the user picked beats a detected one; neither = let the API detect.
  const [picked, setPicked] = useState<string | null>(null);
  const [detected, setDetected] = useState<string>();
  const [target, setTarget] = useState<string>();
  // A pair chip the user clicked; otherwise the pair comes from history and favorites.
  const [pair, setPair] = useState<Pair | null>(null);
  const [result, setResult] = useState<{ lang: string; versions: string[] } | null>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [signIn, setSignIn] = useState(false);
  // Dictated text came with its language: no detect for it. `pick`: the next "into" pick translates it.
  const dictation = useRef<{ text: string; pick: boolean } | null>(null);

  // Detect on a typing pause, like the in-page menu does on open. A failure or "und" is just "not detected".
  useEffect(() => {
    if (!text.trim()) setDetected(undefined);
    if (picked || text.trim().length < 2 || text === dictation.current?.text) return;
    let live = true;
    const timer = setTimeout(async () => {
      const response = await sendMessage({ type: 'detect', text });
      if (live && response.ok && findLanguage(response.data.lang)) setDetected(response.data.lang);
    }, 800);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [text, picked]);

  // Detection orients the base pair; the pair's source is shown but only a picked or detected one is sent.
  const base = pair ?? defaultPair(history, favorites);
  // A picked source orients it too: `detected` keeps its last value while detection is off.
  const oriented = base && orient(base, picked ?? detected);
  const from = picked ?? oriented?.from ?? detected;
  const into = target ?? (oriented && oriented.to !== from ? oriented.to : undefined) ?? favorites.find((lang) => lang !== from) ?? favorites[0] ?? 'en';
  // ponytail: a ⌘↵ before detection answers lets the API detect; if it finds the target language, that one goes X→X.
  const sent = picked ?? detected;
  const shown = result?.versions[version];
  const fail = (message: string) => setNotice({ message, isError: true });

  /**
   * Translates `text`. `base` = earlier versions of the same request ("Try another"): the answer is
   * appended to them and not saved to history again. Explicit arguments, so a history retry can
   * run before the restored state has rendered.
   */
  const translate = async (text: string, from: string | undefined, into: string, base: string[] = []) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setNotice(null);
    setSignIn(false);
    const response = await sendMessage({ type: 'translate', text, targetLang: into, ...(from ? { sourceLang: from } : {}) });
    setBusy(false);
    if (!response.ok) {
      if (response.error.code === 'unauthenticated') setSignIn(true);
      else fail(response.error.message);
      return;
    }
    const source = from ?? response.data.detectedSourceLang;
    if (!from && source && findLanguage(source)) setDetected(source);
    const versions = [...base, response.data.text];
    setResult({ lang: into, versions });
    setVersion(versions.length - 1);
    const voice = dictation.current?.text === text ? { voice: true as const } : {};
    if (!base.length) await remember({ text, result: response.data.text, to: into, site: '' /* typed in the popup, not on a page */, at: Date.now(), ...(source ? { from: source } : {}), ...voice });
  };

  /** Opens a history entry on Home. */
  const restore = (entry: HistoryEntry) => {
    // A grammar fix has no language pair: its fixed text goes back into the input, ready to translate.
    if (entry.kind === 'grammar') {
      setText(entry.result);
      setResult(null);
      return;
    }
    setText(entry.text);
    setPicked(entry.from ?? null);
    setTarget(entry.to);
    setResult({ lang: entry.to, versions: [entry.result] });
    setVersion(0);
  };

  /**
   * Voice input's text, with the language the API heard. English → 'grammar' (the caller opens the
   * fix); a language the user has a pair for → translated into its target at once; else 'pick':
   * the caller opens the "into" picker, and that pick translates.
   */
  const dictated = (spoken: string, lang: string): 'grammar' | 'translated' | 'pick' => {
    const known = findLanguage(lang) ? lang : undefined;
    setText(spoken);
    setResult(null);
    setPair(null);
    setPicked(null);
    setTarget(undefined);
    setDetected(known);
    const to = pairFor(topPairs(history, Infinity), known);
    dictation.current = { text: spoken, pick: known !== 'en' && !to };
    if (known === 'en') return 'grammar';
    if (!to) return 'pick';
    setTarget(to);
    void translate(spoken, known, to);
    return 'translated';
  };

  return {
    text,
    setText,
    from,
    fromDetected: !picked && detected !== undefined,
    into,
    result,
    version,
    setVersion,
    shown,
    busy,
    notice,
    setNotice,
    fail,
    signingIn: signIn,
    translate: () => void translate(text, sent, into),
    retry: () => result && void translate(text, sent, result.lang, result.versions),
    restore,
    /** A bad history entry: open it and ask again, keeping the old answer as version 1. */
    retryEntry: (entry: Extract<HistoryEntry, { to: string }>) => {
      restore(entry);
      void translate(entry.text, entry.from, entry.to, [entry.result]);
    },
    choosePair: (chosen: Pair) => {
      setPair(chosen);
      setPicked(null);
      setTarget(undefined);
    },
    /** From the language picker; null on the from side = detect automatically. */
    choose: (side: 'from' | 'into', lang: string | null) => {
      if (side === 'from') setPicked(lang);
      else if (lang) setTarget(lang);
      if (side === 'into' && lang && dictation.current?.pick && dictation.current.text === text) {
        dictation.current.pick = false;
        void translate(text, sent, lang);
      }
    },
    dictated,
    swap: () => {
      if (!from) return;
      setPicked(into);
      setTarget(from);
      setDetected(undefined);
      if (shown !== undefined) {
        setText(shown);
        setResult(null);
      }
    },
    signIn: (provider: string) =>
      void sendMessage({ type: 'sign-in', provider: provider as ProviderId }).then((response) => {
        if (!response.ok) return fail(response.error.message);
        setSignIn(false);
        setNotice({ message: 'Signed in', isError: false });
      }),
  };
}
