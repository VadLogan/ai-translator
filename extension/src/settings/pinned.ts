import { storage } from 'wxt/utils/storage';

// Local to this browser on purpose, like disabled fields: not part of the synced Settings.
const item = storage.defineItem<string[]>('local:pinnedLanguages', { fallback: [] });

/** Languages the user pinned: always first in "Yours", in the order they were pinned. */
export const pinnedLanguages = {
  get: () => item.getValue(),
  async toggle(code: string): Promise<string[]> {
    const list = await item.getValue();
    const next = list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
    await item.setValue(next);
    return next;
  },
};
