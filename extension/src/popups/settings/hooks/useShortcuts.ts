import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

/**
 * The key that opens the toolbar popup (`_execute_action` in the manifest). Chrome owns extension
 * shortcuts and has no API to change them, so "Change" opens its shortcuts page; the key is
 * read again when this tab gets focus back.
 */
export function useShortcuts() {
  /** '' = not set, undefined = still loading. */
  const [openPopup, setOpenPopup] = useState<string>();
  useEffect(() => {
    const read = () =>
      void browser.commands.getAll().then((commands) => setOpenPopup(commands.find((command) => command.name === '_execute_action')?.shortcut ?? ''));
    read();
    window.addEventListener('focus', read);
    return () => window.removeEventListener('focus', read);
  }, []);
  return { openPopup, change: () => void browser.tabs.create({ url: 'chrome://extensions/shortcuts' }) };
}
