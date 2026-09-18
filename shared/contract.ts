/** Wire contract between the extension (frontend) and the API. Types only. */

export interface TranslateBody {
  text: string;
  /** Language code, e.g. "en", "uk", "de". */
  targetLang: string;
  /** Omit to let the provider auto-detect. */
  sourceLang?: string;
}

export interface TranslateOk {
  text: string;
  detectedSourceLang?: string;
}

export type ApiErrorCode = 'invalid-input' | 'rate-limited' | 'not-found' | 'provider-failed';

export interface TranslateErr {
  error: { message: string; code: ApiErrorCode };
}

export const MAX_TEXT_LENGTH = 5000;
