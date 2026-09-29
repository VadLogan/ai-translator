import { useEffect, useRef } from 'react';
import { isSiteDisabled } from '../../../core/sites';
import { disabledFields, type DisabledField } from '../../../settings/disabled-fields';
import { storageSettings } from '../../../settings/storage-settings';

/**
 * Where the widget may not appear: the whole site (Settings.disabledSites, from the options page or
 * the popup's switch) and the fields turned off from the hover pill. Refs, not state: refresh() is
 * sync and reads them from event handlers. Both follow storage, so a change applies to open tabs.
 */
export function useSiteGate(onSiteDisabled: () => void) {
  const siteDisabled = useRef(false);
  // fieldKey()s on this site the user turned off from the icon's hover pill.
  const offFields = useRef(new Set<string>());

  useEffect(() => {
    const apply = ({ disabledSites }: { disabledSites: string[] }) => {
      siteDisabled.current = isSiteDisabled(location.hostname, disabledSites);
      if (siteDisabled.current) onSiteDisabled();
    };
    storageSettings.get().then(apply, () => {});
    return storageSettings.watch(apply);
  }, []);

  useEffect(() => {
    const apply = (list: DisabledField[]) => {
      offFields.current = new Set(list.filter(({ site }) => site === location.hostname).map(({ key }) => key));
    };
    disabledFields.get().then(apply, () => {});
    return disabledFields.watch(apply);
  }, []);

  /** No icon in this field again, until the options page says so. */
  function disableField(key: string, label: string): void {
    offFields.current.add(key); // now, not when the storage write echoes back
    void disabledFields.add({ site: location.hostname, key, label }).catch(() => {});
  }

  return { siteDisabled, offFields, disableField };
}
