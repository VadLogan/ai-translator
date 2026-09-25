import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import type { Settings } from '../../../../shared/contract';
import { PROVIDERS, type ProviderId } from '../../auth/providers';
import { findLanguage } from '../../core/languages';
import { isSiteDisabled, parseSites } from '../../core/sites';
import { sendMessage } from '../../messaging/messages';
import { defaultPair, historyStore, orient, topPairs, usedLately, type HistoryEntry, type Pair } from '../../settings/history';
import { storageSettings } from '../../settings/storage-settings';
import { followColorScheme } from '../../ui/color-scheme';
import { Popup, type PopupScreen } from './Popup';
import '../../ui/theme.css';

followColorScheme();

type Notice = { message: string; isError: boolean };

/** The tab the popup opened over: its id (for Insert) and hostname, empty on a non-web page. */
async function activeTab(): Promise<{ id?: number; host: string }> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const web = tab?.url && /^https?:/.test(tab.url);
  return { id: tab?.id, host: web ? (parseSites(tab.url!).sites[0] ?? '') : '' };
}

function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tab, setTab] = useState<{ id?: number; host: string }>({ host: '' });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [screen, setScreen] = useState<PopupScreen>('home');
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
  const [undo, setUndo] = useState<{ label: string; previous: HistoryEntry[] } | null>(null);

  useEffect(() => {
    // Cache first so the popup paints at once, then the server's copy (the worker falls back to the cache).
    void storageSettings.get().then(setSettings);
    void sendMessage({ type: 'get-settings' }).then((response) => response.ok && setSettings(response.data));
    void activeTab().then(setTab);
    void historyStore.get().then(setHistory);
  }, []);

  // Detect on a typing pause, like the in-page menu does on open. A failure or "und" is just "not detected".
  useEffect(() => {
    if (!text.trim()) setDetected(undefined);
    if (picked || text.trim().length < 2) return;
    let live = true;
    const timer = setTimeout(async () => {
      const response = await sendMessage({ type: 'detect', text });
      if (live && response.ok && !response.data.mistyped && findLanguage(response.data.lang)) setDetected(response.data.lang);
    }, 800);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [text, picked]);

  const favorites = settings?.favoriteLanguages ?? [];
  // Detection orients the base pair; the pair's source is shown but only a picked or detected one is sent.
  const base = pair ?? defaultPair(history, favorites);
  // A picked source orients it too: `detected` keeps its last value while detection is off.
  const oriented = base && orient(base, picked ?? detected);
  const from = picked ?? oriented?.from ?? detected;
  const into = target ?? (oriented && oriented.to !== from ? oriented.to : undefined) ?? favorites.find((lang) => lang !== from) ?? favorites[0] ?? 'en';
  // ponytail: a ⌘↵ before detection answers lets the API detect; if it finds the target language, that one goes X→X.
  const sent = picked ?? detected;
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
    if (!base.length) {
      const entry = { text, result: response.data.text, to: into, site: tab.host, at: Date.now(), ...(source ? { from: source } : {}) };
      setHistory(await historyStore.add(entry));
    }
  };

  const restore = (entry: HistoryEntry) => {
    setUndo(null);
    setScreen('home');
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

  // History edits write the whole list. Delete and clear keep the list before them for Undo.
  const saveHistory = async (list: HistoryEntry[]) => setHistory(await historyStore.set(list));
  const remove = (list: HistoryEntry[], label: string) => {
    setUndo({ label, previous: history });
    void saveHistory(list);
  };

  const shown = result?.versions[version];

  const insert = async () => {
    if (shown === undefined || tab.id === undefined) return;
    // Only the frame holding a focused field answers; no answer = nothing to insert into.
    const inserted = await browser.tabs.sendMessage(tab.id, { type: 'insert', text: shown }).catch(() => undefined);
    if (inserted) window.close();
    else fail('Click into a field on the page first.');
  };

  const toggleSite = async (on: boolean) => {
    if (!settings) return;
    // Turning on also clears a parent domain that covered this host, or the switch would do nothing.
    const disabledSites = on
      ? settings.disabledSites.filter((site) => !isSiteDisabled(tab.host, [site]))
      : [...settings.disabledSites, tab.host];
    const response = await sendMessage({ type: 'save-settings', settings: { ...settings, disabledSites } });
    if (!response.ok) return fail(response.error.message);
    setSettings(response.data);
  };

  return (
    <Popup
      screen={screen}
      site={tab.host && settings ? { host: tab.host, on: !isSiteDisabled(tab.host, settings.disabledSites) } : null}
      onToggleSite={(on) => void toggleSite(on)}
      onOpenHistory={() => setScreen('history')}
      onOpenSettings={() => void sendMessage({ type: 'open-options' }).then(() => window.close())}
      onBack={() => (setUndo(null), setScreen('home'))}
      from={from}
      fromDetected={!picked && detected !== undefined}
      into={into}
      pairs={topPairs(history)}
      onPair={(chosen) => {
        setPair(chosen);
        setPicked(null);
        setTarget(undefined);
      }}
      onPick={(side) => setScreen({ pick: side })}
      onSwap={() => {
        if (!from) return;
        setPicked(into);
        setTarget(from);
        setDetected(undefined);
        if (shown !== undefined) {
          setText(shown);
          setResult(null);
        }
      }}
      text={text}
      onTextChange={setText}
      onTranslate={() => void translate(text, sent, into)}
      busy={busy}
      result={result}
      version={version}
      onVersion={setVersion}
      onRetry={() => result && void translate(text, sent, result.lang, result.versions)}
      onCopy={() =>
        shown !== undefined &&
        void navigator.clipboard.writeText(shown).then(() => setNotice({ message: 'Copied', isError: false }))
      }
      onInsert={() => void insert()}
      notice={notice}
      providers={signIn ? PROVIDERS : null}
      onSignIn={(provider) =>
        void sendMessage({ type: 'sign-in', provider: provider as ProviderId }).then((response) => {
          if (!response.ok) return fail(response.error.message);
          setSignIn(false);
          setNotice({ message: 'Signed in', isError: false });
        })
      }
      history={history}
      onRestore={restore}
      onRate={(entry, rating) =>
        void saveHistory(history.map((e) => (e.at === entry.at ? { ...e, rating } : e)))
      }
      onCopyEntry={(entry) => void navigator.clipboard.writeText(entry.result)}
      onRetryEntry={(entry) => {
        restore(entry);
        void translate(entry.text, entry.from, entry.to, [entry.result]);
      }}
      onDelete={(entry) => remove(history.filter((e) => e.at !== entry.at), 'Deleted 1 translation')}
      onClearAll={() => remove([], `Cleared ${history.length} translations`)}
      undo={undo && { label: undo.label, onUndo: () => (void saveHistory(undo.previous), setUndo(null)) }}
      favorites={favorites}
      lately={usedLately(history, favorites, typeof screen === 'object' && screen.pick === 'from' ? 'from' : 'to')}
      onChoose={(lang) => {
        if (typeof screen === 'object' && screen.pick === 'from') setPicked(lang);
        else if (lang) setTarget(lang);
        setScreen('home');
      }}
    />
  );
}

createRoot(document.getElementById('root')!).render(<App />);
