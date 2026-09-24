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
  /** Language code the provider detected, e.g. "en", "pl", "de". "und" when it could not tell. */
  lang: string;
  /**
   * The text is not a language at all but one typed on the wrong keyboard layout ("ghbdtn" for
   * "привет"). `lang` is then "und"; the client re-types it locally with `switchLayout`.
   */
  mistyped?: boolean;
  usage?: TokenUsage;
  model?: string;
}

/** Grammar fix: the same text + url as detection. */
export type FixGrammarBody = DetectBody;

export interface FixGrammarOk {
  /** The corrected text, in the same language. Unchanged when there was nothing to fix. */
  text: string;
  /**
   * The corrected text as escaped HTML, each edit (a word, a punctuation mark or a range of words)
   * wrapped in `<span class="fix" data-original="…">`. An insertion has `data-original=""`; a
   * deletion is an empty span.
   */
  html: string;
  usage?: TokenUsage;
  model?: string;
}

export const REWRITE_STYLES = ['natural', 'formal'] as const;
/** `natural`: how a native speaker would say it. `formal`: official / business register. */
export type RewriteStyle = (typeof REWRITE_STYLES)[number];

/** Rewrite: the same text + url as detection, plus the style to rewrite into. */
export interface RewriteBody extends DetectBody {
  style: RewriteStyle;
}

export interface RewriteOk {
  /** The rewritten text, in the same language. */
  text: string;
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
  /** Language codes shown in the in-page menu, in order. Empty = not chosen yet: the extension
   * falls back to the browser's languages, which only it can see. */
  favoriteLanguages: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  favoriteLanguages: [],
};

/** Language code, e.g. "de" or "pt-BR". Shared by targetLang and favoriteLanguages validation. */
export const LANGUAGE_CODE = /^[a-zA-Z-]{2,8}$/;

export const MAX_TEXT_LENGTH = 5000;
export const MAX_FAVORITE_LANGUAGES = 20;
export const MAX_URL_LENGTH = 2048;
