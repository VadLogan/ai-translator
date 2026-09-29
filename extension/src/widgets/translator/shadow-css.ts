/**
 * Chrome ignores `@property` inside a shadow root, so Tailwind's registered defaults
 * (`--tw-border-style: solid`, the `--tw-shadow` layers, ...) never exist there and every border
 * and shadow silently drops out. Re-declare them as plain custom properties on every element, in
 * the `properties` layer Tailwind declares first, so any utility still overrides them. Storybook
 * renders in the light DOM, which is why it never showed this.
 */
export function withPropertyDefaults(css: string): string {
  const defaults = [...css.matchAll(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/g)].map(
    ([, name, body]) => `${name}:${/initial-value\s*:\s*([^;]+)/.exec(body!)?.[1]?.trim() ?? 'initial'};`,
  );
  return `${css}\n@layer properties{*,::before,::after,::backdrop{${defaults.join('')}}}`;
}

/**
 * `rem` inside a shadow root still means the *page's* root font size, so on a site with
 * `html { font-size: 10px }` every Tailwind/HeroUI spacing and radius shrinks while our px type
 * scale doesn't. Pin rem to the 16px the design assumes.
 */
export function remToPx(css: string): string {
  return css.replace(/(?<![\w.-])(-?\d*\.?\d+)rem\b/g, (_, n: string) => `${+n * 16}px`);
}
