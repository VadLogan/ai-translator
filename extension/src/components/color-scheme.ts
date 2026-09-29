import { useSyncExternalStore } from 'react';

/**
 * HeroUI reads its theme from a `.light` / `.dark` ancestor and ships no prefers-color-scheme
 * fallback for its variables, so the extension pages follow the OS themselves.
 */
export function followColorScheme(): void {
  const colorScheme = matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    document.documentElement.classList.toggle('dark', colorScheme.matches);
    document.documentElement.classList.toggle('light', !colorScheme.matches);
  };
  colorScheme.addEventListener('change', apply);
  apply();
}

const darkQuery = () => matchMedia('(prefers-color-scheme: dark)');

function subscribeDark(onChange: () => void): () => void {
  const query = darkQuery();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** The OS dark mode, live. For a shadow root, where followColorScheme's class on <html> doesn't reach. */
export const usePrefersDark = (): boolean => useSyncExternalStore(subscribeDark, () => darkQuery().matches);
