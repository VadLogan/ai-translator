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
