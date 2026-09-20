/** OAuth providers offered in the UI. Adding one is a config block in supabase/config.toml plus an entry here. */
export const PROVIDERS = [
  { id: 'google', name: 'Google' },
  { id: 'facebook', name: 'Facebook' },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]['id'];

export function isProviderId(value: unknown): value is ProviderId {
  return PROVIDERS.some((provider) => provider.id === value);
}
