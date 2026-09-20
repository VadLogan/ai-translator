/** Wire contract between the extension (frontend) and the API. Types only. */

export interface TranslateBody {
  text: string;
  /** Language code, e.g. "en", "uk", "de". */
  targetLang: string;
  /** Omit to let the provider auto-detect. */
  sourceLang?: string;
  /** Page the extension was used on. The background worker fills it from the sender tab. */
  url?: string;
}

export interface TranslateOk {
  text: string;
  detectedSourceLang?: string;
  /** What the translation cost. Absent if the provider didn't report it. */
  usage?: TokenUsage;
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

export const MAX_TEXT_LENGTH = 5000;
export const MAX_URL_LENGTH = 2048;
