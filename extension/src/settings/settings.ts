export interface Settings {
  /** Language codes shown in the in-page menu, in order. */
  favoriteLanguages: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  favoriteLanguages: ['en', 'uk', 'de', 'es', 'fr'],
};
