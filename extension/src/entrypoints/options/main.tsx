import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LANGUAGES } from '../../core/languages';
import { PROVIDERS } from '../../auth/providers';
import { type Account, sendMessage } from '../../messaging/messages';
import { OptionsPage } from './OptionsPage';
import '../../ui/theme.css';

// HeroUI reads its theme from a `.light` / `.dark` ancestor and ships no prefers-color-scheme
// fallback for its variables, so follow the OS here the way the old stylesheet did.
const colorScheme = matchMedia('(prefers-color-scheme: dark)');
const applyColorScheme = () => {
  document.documentElement.classList.toggle('dark', colorScheme.matches);
  document.documentElement.classList.toggle('light', !colorScheme.matches);
};
colorScheme.addEventListener('change', applyColorScheme);
applyColorScheme();

function Options() {
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  // The saved order, which the in-page menu follows. `checked` is what the boxes show right now.
  const [saved, setSaved] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [status, setStatus] = useState({ message: '', isError: false });
  const [busy, setBusy] = useState(false);

  const fail = (message: string) => setStatus({ message, isError: true });

  /**
   * Sign-in runs in the background worker: chrome.identity is not available here, and the worker
   * is where the session is stored.
   */
  const loadAccount = useCallback(async () => {
    const response = await sendMessage({ type: 'get-account' });
    if (!response.ok) return fail(response.error.message);
    setAccount(response.data);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadAccount();
      // Settings come through the worker, which owns the access token and keeps the chrome.storage
      // cache in step. Signed out or API down, it answers from that cache.
      const response = await sendMessage({ type: 'get-settings' });
      if (!response.ok) return fail(response.error.message);
      setSaved(response.data.favoriteLanguages);
      setChecked(response.data.favoriteLanguages);
    })();
  }, [loadAccount]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } finally {
      setBusy(false);
    }
  };

  const signIn = (provider: string) =>
    void run(async () => {
      setStatus({ message: '', isError: false });
      const response = await sendMessage({ type: 'sign-in', provider: provider as (typeof PROVIDERS)[number]['id'] });
      if (!response.ok) return fail(response.error.message);
      await loadAccount();
    });

  const signOut = () =>
    void run(async () => {
      const response = await sendMessage({ type: 'sign-out' });
      if (!response.ok) return fail(response.error.message);
      await loadAccount();
    });

  const save = () =>
    void run(async () => {
      // Keep the user's existing order, append newly checked languages at the end.
      const next = [
        ...saved.filter((code) => checked.includes(code)),
        ...checked.filter((code) => !saved.includes(code)),
      ];
      const response = await sendMessage({ type: 'save-settings', settings: { favoriteLanguages: next } });
      if (!response.ok) return fail(response.error.message);
      setSaved(response.data.favoriteLanguages);
      setChecked(response.data.favoriteLanguages);
      setStatus({ message: 'Saved', isError: false });
      setTimeout(() => setStatus({ message: '', isError: false }), 2000);
    });

  return (
    <OptionsPage
      account={account}
      providers={PROVIDERS}
      languages={LANGUAGES}
      favorites={checked}
      status={status}
      busy={busy}
      onSignIn={signIn}
      onSignOut={signOut}
      onFavoritesChange={setChecked}
      onSave={save}
    />
  );
}

createRoot(document.getElementById('root')!).render(<Options />);
