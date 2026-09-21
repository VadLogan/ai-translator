import { storage } from 'wxt/utils/storage';
import { DEFAULT_SETTINGS, type Settings } from '../../../shared/contract';

const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});

export const storageSettings = {
  async get(): Promise<Settings> {
    // Merge so settings saved by older versions pick up newly added fields.
    return { ...DEFAULT_SETTINGS, ...(await settingsItem.getValue()) };
  },
  async update(patch: Partial<Settings>): Promise<Settings> {
    const next = { ...(await this.get()), ...patch };
    await settingsItem.setValue(next);
    return next;
  },
};
