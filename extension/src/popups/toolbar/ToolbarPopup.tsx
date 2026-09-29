import { useState } from 'react';
import { browser } from 'wxt/browser';
import { PROVIDERS } from '../../auth/providers';
import { sendMessage } from '../../messaging/messages';
import { intoLanguages, topPairs, usedLately, type HistoryEntry } from '../../settings/history';
import { useActiveSite } from './hooks/useActiveSite';
import { useHistory } from './hooks/useHistory';
import { useTranslation } from './hooks/useTranslation';
import { PopupFrame } from './Popup';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Languages } from './screens/Languages';

type Screen = 'home' | 'history' | { pick: 'from' | 'into' };

/** The container: composes the hooks and picks the screen. */
export function ToolbarPopup() {
  const [screen, setScreen] = useState<Screen>('home');
  const history = useHistory();
  // The site switch reports into the translator's notice line, the popup's one message slot.
  const site = useActiveSite((message) => translation.fail(message));
  const translation = useTranslation({ favorites: site.favorites, history: history.history, remember: history.add, host: site.tab.host });
  const { favorites } = site;

  const home = () => (history.dropUndo(), setScreen('home'));
  const restore = (entry: HistoryEntry) => {
    home();
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

  if (screen === 'history') {
    return (
      <PopupFrame>
        <History
          history={history.history}
          onBack={home}
          onRestore={restore}
          onRate={history.rate}
          onCopyEntry={(entry) => void navigator.clipboard.writeText(entry.result)}
          onRetryEntry={(entry) => {
            home();
            translation.retryEntry(entry);
          }}
          onDelete={history.remove}
          onClearAll={history.clearAll}
          undo={history.undo}
        />
      </PopupFrame>
    );
  }

  if (typeof screen === 'object') {
    const side = screen.pick;
    return (
      <PopupFrame>
        <Languages
          side={side}
          current={side === 'into' ? translation.into : translation.from}
          // The into side shows only the 3 most used favorites; the rest stay one search away.
          yours={side === 'into' ? intoLanguages(favorites, history.history).yours : favorites.slice(0, 9)}
          lately={usedLately(history.history, favorites, side === 'from' ? 'from' : 'to')}
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
