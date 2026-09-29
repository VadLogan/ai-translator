import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import type { Settings } from '../../../../../shared/contract';
import { isSiteDisabled, parseSites } from '../../../core/sites';
import { sendMessage } from '../../../messaging/messages';
import { storageSettings } from '../../../settings/storage-settings';

type Tab = { id?: number; host: string };

/** The tab the popup opened over: its id (for Insert) and hostname, empty on a non-web page. */
async function activeTab(): Promise<Tab> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const web = tab?.url && /^https?:/.test(tab.url);
  return { id: tab?.id, host: web ? (parseSites(tab.url!).sites[0] ?? '') : '' };
}

/** The settings and the tab under the popup: the header's on/off switch for this site. */
export function useActiveSite(fail: (message: string) => void) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tab, setTab] = useState<Tab>({ host: '' });

  useEffect(() => {
    // Cache first so the popup paints at once, then the server's copy (the worker falls back to the cache).
    void storageSettings.get().then(setSettings);
    void sendMessage({ type: 'get-settings' }).then((response) => response.ok && setSettings(response.data));
    void activeTab().then(setTab);
  }, []);

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

  return {
    tab,
    favorites: settings?.favoriteLanguages ?? [],
    site: tab.host && settings ? { host: tab.host, on: !isSiteDisabled(tab.host, settings.disabledSites) } : null,
    toggleSite,
  };
}
