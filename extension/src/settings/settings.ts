export interface Settings {
  activeProviderId: string;
  /** Language codes shown in the in-page menu, in order. */
  favoriteLanguages: string[];
  /** Provider-specific config (API keys, models, ...) keyed by provider id. */
  providerConfigs: Record<string, unknown>;
}

export const DEFAULT_SETTINGS: Settings = {
  activeProviderId: 'api',
  favoriteLanguages: ['en', 'uk', 'de', 'es', 'fr'],
  providerConfigs: {},
};

export interface SettingsReader {
  get(): Promise<Settings>;
}

export interface SettingsRepository extends SettingsReader {
  update(patch: Partial<Settings>): Promise<Settings>;
}
