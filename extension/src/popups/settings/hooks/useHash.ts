import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** The URL's #fragment without the #, live: the section the nav picks out. */
export const useHash = (): string => useSyncExternalStore(subscribe, () => location.hash.slice(1));
