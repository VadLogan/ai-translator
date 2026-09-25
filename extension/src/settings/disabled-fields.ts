import { storage } from 'wxt/utils/storage';

/** A field the user turned the extension off in. `key` is `fieldKey()`, `label` what the options page shows. */
export interface DisabledField {
  site: string;
  key: string;
  label: string;
}

// Local to this browser on purpose: unlike Settings, it is not synced to the server.
const item = storage.defineItem<DisabledField[]>('local:disabledFields', { fallback: [] });

const same = (a: DisabledField, site: string, key: string) => a.site === site && a.key === key;

export const disabledFields = {
  get: () => item.getValue(),
  async add(field: DisabledField): Promise<void> {
    const list = await item.getValue();
    if (!list.some((entry) => same(entry, field.site, field.key))) await item.setValue([...list, field]);
  },
  async remove(site: string, key: string): Promise<void> {
    await item.setValue((await item.getValue()).filter((entry) => !same(entry, site, key)));
  },
  watch: (callback: (list: DisabledField[]) => void) => item.watch((list) => callback(list ?? [])),
};
