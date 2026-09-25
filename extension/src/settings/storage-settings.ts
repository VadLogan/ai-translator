import { storage } from 'wxt/utils/storage';
import { DEFAULT_SETTINGS, type Settings } from '../../../shared/contract';
import { browserLanguages } from '../core/languages';

const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});

export const storageSettings = {
  async get(): Promise<Settings> {
    // Merge so settings saved by older versions pick up newly added fields.
    const settings = { ...DEFAULT_SETTINGS, ...(await settingsItem.getValue()) };
    // No favorites chosen yet (fresh install, or a server profile that never saved any).
    if (!settings.favoriteLanguages.length) settings.favoriteLanguages = browserLanguages();
    return settings;
  },
  /** Called with the new settings whenever any context writes them (the options page, sign-in). */
  watch(callback: (settings: Settings) => void): () => void {
    return settingsItem.watch(() => void this.get().then(callback));
  },
  async update(patch: Partial<Settings>): Promise<Settings> {
    await settingsItem.setValue({ ...(await this.get()), ...patch });
    return this.get();
  },
};
