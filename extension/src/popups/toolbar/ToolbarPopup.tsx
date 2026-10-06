import { useState } from 'react';
import { browser } from 'wxt/browser';
import { PROVIDERS } from '../../auth/providers';
import { sendMessage } from '../../messaging/messages';
import { intoLanguages, pinFirst, topPairs, usedLately, type HistoryEntry } from '../../settings/history';
import { useActiveSite } from './hooks/useActiveSite';
import { useDictation } from './hooks/useDictation';
import { useGrammarFix } from './hooks/useGrammarFix';
import { useHistory } from './hooks/useHistory';
import { useMeetingDetail } from './hooks/useMeetingDetail';
import { useMeetings } from './hooks/useMeetings';
import { usePinned } from './hooks/usePinned';
import { useTranslation } from './hooks/useTranslation';
import { PopupFrame } from './Popup';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Languages } from './screens/Languages';
import { MeetingDetail } from './screens/MeetingDetail';
import { whenLabel, type MeetingRecord } from '../../settings/meetings';

type Screen = 'home' | 'history' | { pick: 'from' | 'into' } | { meeting: number };

/** The container: composes the hooks and picks the screen. */
export function ToolbarPopup() {
  const [screen, setScreen] = useState<Screen>('home');
  const [historyTab, setHistoryTab] = useState<'texts' | 'meetings'>('texts');
  const history = useHistory();
  const meetings = useMeetings();
  const pins = usePinned();
  // The site switch reports into the translator's notice line, the popup's one message slot.
  const site = useActiveSite((message) => translation.fail(message));
  const translation = useTranslation({ favorites: site.favorites, history: history.history, remember: history.add });
  const { favorites } = site;
  const grammar = useGrammarFix({ text: translation.text, setText: translation.setText, remember: history.add, onError: translation.fail });
  // Dictated English gets the grammar fix; a language with no usual pair, the "into" picker.
  const dictation = useDictation({
    onError: translation.fail,
    onPreview: translation.previewDictation,
    onText: (text, lang) => {
      grammar.endRun();
      const next = translation.dictated(text, lang);
      if (next === 'grammar') grammar.start(text, true, dictation.fixer);
      else if (next === 'pick') setScreen({ pick: 'into' });
    },
  });

  const home = () => (history.dropUndo(), meetings.dropUndo(), setHistoryTab('texts'), setScreen('home'));
  const restore = (entry: HistoryEntry) => {
    home();
    grammar.endRun();
    translation.restore(entry);
  };

  const insert = async () => {
    const { shown } = translation;
    if (shown === undefined || site.tab.id === undefined) return;
    // Only the frame holding a focused field answers; no answer = nothing to insert into.
    const inserted = await browser.tabs.sendMessage(site.tab.id, { type: 'insert', text: shown }).catch(() => undefined);
    if (inserted) window.close();
    else translation.fail('Click into a field on the page first.');
  };

  if (typeof screen === 'object' && 'meeting' in screen) {
    const record = meetings.meetings.find((m) => m.at === screen.meeting);
    if (record) {
      return (
        <PopupFrame>
          <MeetingScreen
            key={record.at}
            record={record}
            onBack={() => setScreen('history')}
            onDelete={() => (meetings.remove(record), setScreen('history'))}
            onSaved={meetings.reload}
          />
        </PopupFrame>
      );
    }
  }

  if (screen === 'history' || (typeof screen === 'object' && 'meeting' in screen)) {
    return (
      <PopupFrame>
        <History
          history={history.history}
          onBack={home}
          onRestore={restore}
          onToggleStar={history.toggleStar}
          onCopyEntry={(entry) => void navigator.clipboard.writeText(entry.result)}
          onRetryEntry={(entry) => {
            home();
            translation.retryEntry(entry);
          }}
          onDelete={history.remove}
          onClearAll={history.clearAll}
          undo={history.undo}
          tab={historyTab}
          onTab={setHistoryTab}
          meetings={{
            meetings: meetings.meetings,
            // The meeting card is still a scripted demo: Start only in dev builds, on a web page.
            startHost: import.meta.env.DEV && site.tab.host ? site.tab.host : null,
            onStart: () => void meetings.start(site.tab.id),
            onCopyNote: meetings.copyNote,
            onClearAll: meetings.clearAll,
            onOpen: (record) => (meetings.dropUndo(), setScreen({ meeting: record.at })),
            notice: meetings.notice,
            undo: meetings.undo,
          }}
        />
      </PopupFrame>
    );
  }

  if (typeof screen === 'object' && 'pick' in screen) {
    const side = screen.pick;
    return (
      <PopupFrame>
        <Languages
          side={side}
          current={side === 'into' ? translation.into : translation.from}
          // The into side shows the pins plus the most used favorites (3 in all); the rest stay one search away.
          yours={side === 'into' ? intoLanguages(favorites, history.history, pins.pinned).yours : pinFirst(pins.pinned, favorites).slice(0, Math.max(9, pins.pinned.length))}
          lately={usedLately(history.history, pinFirst(pins.pinned, favorites), side === 'from' ? 'from' : 'to')}
          pinned={pins.pinned}
          onTogglePin={pins.toggle}
          onBack={home}
          onChoose={(lang) => {
            translation.choose(side, lang);
            setScreen('home');
          }}
        />
      </PopupFrame>
    );
  }

  return (
    <PopupFrame>
      <Home
        site={site.site}
        onToggleSite={(on) => void site.toggleSite(on)}
        onOpenHistory={() => setScreen('history')}
        onOpenSettings={() => void sendMessage({ type: 'open-options' }).then(() => window.close())}
        from={translation.from}
        fromDetected={translation.fromDetected}
        into={translation.into}
        pairs={topPairs(history.history)}
        onPair={translation.choosePair}
        onPick={(side) => setScreen({ pick: side })}
        onSwap={translation.swap}
        text={translation.text}
        onTextChange={translation.setText}
        onTranslate={translation.translate}
        dictation={dictation.state}
        dictationLevel={dictation.level}
        dictationSeconds={dictation.seconds}
        dictationText={dictation.text}
        onDictate={dictation.start}
        onStopDictation={dictation.stop}
        onCancelDictation={dictation.cancel}
        grammar={grammar.view}
        busy={translation.busy}
        result={translation.result}
        version={translation.version}
        onVersion={translation.setVersion}
        onRetry={translation.retry}
        onCopy={() => {
          const { shown } = translation;
          if (shown !== undefined) void navigator.clipboard.writeText(shown).then(() => translation.setNotice({ message: 'Copied', isError: false }));
        }}
        onInsert={() => void insert()}
        notice={translation.notice}
        providers={translation.signingIn ? PROVIDERS : null}
        onSignIn={translation.signIn}
        recent={history.history[0]}
        onRestore={restore}
      />
    </PopupFrame>
  );
}

/** One saved meeting: a container of its own, so its hook lives and dies with the screen. */
function MeetingScreen({ record, onBack, onDelete, onSaved }: { record: MeetingRecord; onBack(): void; onDelete(): void; onSaved(): void }) {
  const detail = useMeetingDetail(record, onSaved);
  return <MeetingDetail site={record.site} meta={whenLabel(record)} speakers={record.cast ?? []} onBack={onBack} onDelete={onDelete} {...detail} />;
}
