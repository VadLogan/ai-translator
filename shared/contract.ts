/** Wire contract between the extension (frontend) and the API. Types only. */

export interface TranslateBody {
  text: string;
  /** Language code, e.g. "en", "uk", "de". */
  targetLang: string;
  /**
   * What the client believes the text is written in -- the result of `POST /detect`, or the user's
   * correction of it. Omit to let the provider auto-detect. Also decides `detections.verified`.
   */
  sourceLang?: string;
  /** Page the extension was used on. The background worker fills it from the sender tab. */
  url?: string;
}

export interface TranslateOk {
  text: string;
  detectedSourceLang?: string;
  /** What the translation cost. Absent if the provider didn't report it. */
  usage?: TokenUsage;
  /** The model the provider reports it actually used -- often a dated snapshot of the one requested. */
  model?: string;
}

/** Source-language detection, asked for when the menu opens -- before a target is picked. */
export interface DetectBody {
  text: string;
  /** Page the extension was used on. The background worker fills it from the sender tab. */
  url?: string;
}

export interface DetectOk {
  /** Language code the provider detected, e.g. "en", "pl", "de". */
  lang: string;
  usage?: TokenUsage;
  model?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  /** Input + output, as the provider reports it. */
  totalTokens: number;
}

export type ApiErrorCode = 'invalid-input' | 'unauthenticated' | 'rate-limited' | 'not-found' | 'provider-failed';

export interface TranslateErr {
  error: { message: string; code: ApiErrorCode };
}

/** User settings, stored server-side on `profiles.settings` and cached in chrome.storage. */
export interface Settings {
  /** Language codes shown in the in-page menu, in order. */
  favoriteLanguages: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  favoriteLanguages: ['en', 'pl'],
};

/** Language code, e.g. "de" or "pt-BR". Shared by targetLang and favoriteLanguages validation. */
export const LANGUAGE_CODE = /^[a-zA-Z-]{2,8}$/;

export const MAX_TEXT_LENGTH = 5000;
export const MAX_FAVORITE_LANGUAGES = 20;
export const MAX_URL_LENGTH = 2048;
