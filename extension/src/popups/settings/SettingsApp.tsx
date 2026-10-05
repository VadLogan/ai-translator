import { browser } from 'wxt/browser';
import { PROVIDERS, type ProviderId } from '../../auth/providers';
import { SettingsPage } from './SettingsPage';
import { useAccount } from './hooks/useAccount';
import { useDisabledFields } from './hooks/useDisabledFields';
import { useHash } from './hooks/useHash';
import { useMicPermission } from './hooks/useMicPermission';
import { useSettings } from './hooks/useSettings';
import { useShortcuts } from './hooks/useShortcuts';
import { useVocabulary } from './hooks/useVocabulary';

/** The settings page's container: account, languages, vocabulary, turned-off sites and fields, the mic grant, shortcuts. */
export function SettingsApp() {
  const settings = useSettings();
  const account = useAccount(settings.reload);
  const fields = useDisabledFields();
  const mic = useMicPermission();
  const shortcuts = useShortcuts();
  const vocabulary = useVocabulary();
  const active = useHash();

  return (
    <SettingsPage
      version={browser.runtime.getManifest().version}
      active={active}
      status={settings.status}
      account={account.account}
      accountError={account.error}
      accountBusy={account.busy}
      providers={PROVIDERS}
      onSignIn={(id) => account.signIn(id as ProviderId)}
      onSignOut={account.signOut}
      favorites={settings.favorites}
      onAddLanguage={settings.addLanguage}
      onRemoveLanguage={settings.removeLanguage}
      words={vocabulary.words}
      exceptions={vocabulary.exceptions}
      onRemoveWord={vocabulary.removeWord}
      onListen={vocabulary.listen}
      onAddException={vocabulary.addException}
      onRemoveException={vocabulary.removeException}
      sitesText={settings.sitesText}
      sitesDirty={settings.sitesDirty}
      onSitesChange={settings.setSitesText}
      onSaveSites={settings.saveSites}
      busy={settings.busy}
      disabledFields={fields.fields}
      onEnableField={fields.enable}
      mic={mic.state}
      micRequested={mic.requested}
      onAllowMic={() => void mic.allow()}
      openPopupKey={shortcuts.openPopup}
      onChangeShortcut={shortcuts.change}
    />
  );
}
