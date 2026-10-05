import { useCallback, useEffect, useState } from 'react';
import type { ProviderId } from '../../../auth/providers';
import { type Account, sendMessage } from '../../../messaging/messages';

/**
 * Who is signed in. Sign-in runs in the background worker: chrome.identity is not available here,
 * and the worker is where the session is stored. `onSignedIn`: the worker has just pulled the
 * account's settings into the cache, so the page re-reads them.
 */
export function useAccount(onSignedIn: () => void) {
  /** null = signed out, undefined = still loading. */
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await sendMessage({ type: 'get-account' });
    if (!response.ok) return setError(response.error.message);
    setAccount(response.data);
  }, []);

  useEffect(() => void load(), [load]);

  const run = async (work: () => Promise<string | undefined>) => {
    setBusy(true);
    setError('');
    try {
      const failure = await work();
      if (failure) return setError(failure);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const signIn = (provider: ProviderId) =>
    void run(async () => {
      const response = await sendMessage({ type: 'sign-in', provider });
      if (!response.ok) return response.error.message;
      onSignedIn();
    });

  const signOut = () =>
    void run(async () => {
      const response = await sendMessage({ type: 'sign-out' });
      if (!response.ok) return response.error.message;
    });

  return { account, error, busy, signIn, signOut };
}
