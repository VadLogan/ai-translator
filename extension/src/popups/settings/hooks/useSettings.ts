import { useCallback, useEffect, useRef, useState } from 'react';
import type { Settings } from '../../../../../shared/contract';
import { parseSites } from '../../../core/sites';
import { sendMessage } from '../../../messaging/messages';

/**
 * The synced settings, read and saved through the worker, which owns the access token and keeps
 * the chrome.storage cache in step (signed out or API down, it answers reads from that cache).
 * Languages save on every change; sites are typed, so they save on demand.
 */
export function useSettings() {
  const [saved, setSaved] = useState<Settings>({ favoriteLanguages: [], disabledSites: [] });
  // One hostname per line, as typed; parsed on save.
  const [sitesText, setSitesText] = useState('');
  const [status, setStatus] = useState({ message: '', isError: false });
  const [busy, setBusy] = useState(false);
  const clear = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fail = (message: string) => setStatus({ message, isError: true });

  const reload = useCallback(async () => {
    const response = await sendMessage({ type: 'get-settings' });
    if (!response.ok) return fail(response.error.message);
    setSaved(response.data);
    setSitesText(response.data.disabledSites.join('\n'));
  }, []);

  useEffect(() => {
    void reload();
    return () => clearTimeout(clear.current);
  }, [reload]);

  const save = async (patch: Partial<Settings>) => {
    if (busy) return;
    setBusy(true);
    setSaved({ ...saved, ...patch }); // shown at once, put back if the save fails
    try {
      const response = await sendMessage({ type: 'save-settings', settings: { ...saved, ...patch } });
      if (!response.ok) {
        setSaved(saved);
        return fail(response.error.message);
      }
      setSaved(response.data);
      if (patch.disabledSites) setSitesText(response.data.disabledSites.join('\n'));
      setStatus({ message: 'Saved', isError: false });
      clearTimeout(clear.current);
      clear.current = setTimeout(() => setStatus({ message: '', isError: false }), 2000);
    } finally {
      setBusy(false);
    }
  };

  const favorites = saved.favoriteLanguages;
  return {
    favorites,
    status,
    busy,
    reload: () => void reload(),
    addLanguage: (code: string) => void save({ favoriteLanguages: [...favorites, code] }),
    removeLanguage: (code: string) => {
      // An empty list means "not chosen yet" and falls back to the browser's languages.
      if (favorites.length === 1) return fail('Keep at least one language.');
      void save({ favoriteLanguages: favorites.filter((lang) => lang !== code) });
    },
    sitesText,
    sitesDirty: sitesText !== saved.disabledSites.join('\n'),
    setSitesText,
    saveSites: () => {
      const { sites, invalid } = parseSites(sitesText);
      if (invalid.length) return fail(`Not a site: ${invalid.join(', ')}`);
      void save({ disabledSites: sites });
    },
  };
}
