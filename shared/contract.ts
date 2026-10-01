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
  usage?: TokenUsage;
  model?: string;
}

/** Grammar fix: the same text + url as detection. */
export interface FixGrammarBody extends DetectBody {
  /**
   * The client's `POST /check` of this exact text already passed the guard: skip the second guard
   * call (0.3-0.9 s), as a translate with `sourceLang` does.
   */
  guarded?: boolean;
}

export interface FixGrammarOk {
  /** The corrected text, in the same language. Unchanged when there was nothing to fix. */
  text: string;
  /**
   * The corrected text as escaped HTML, each edit (a word, a punctuation mark or a range of words)
   * wrapped in `<span class="fix" data-original="…">`. An insertion has `data-original=""`; a
   * deletion is an empty span.
   */
  html: string;
  /** The same edits as `html`'s spans, in order, with where they sit in the request text: the inline underlines. */
  edits: FixEdit[];
  usage?: TokenUsage;
  model?: string;
}

export const FIX_KINDS = ['error', 'native'] as const;
/** `error`: grammar, spelling, punctuation. `native`: correct, but not how a native speaker would say it. */
export type FixKind = (typeof FIX_KINDS)[number];

/** One edit of a fix. `start` / `end` index into the request text: `text.slice(start, end) === original`. Never empty. */
export interface FixEdit {
  start: number;
  end: number;
  original: string;
  replacement: string;
  kind: FixKind;
  /** One short sentence, in the text's language. May be empty. */
  reason: string;
}

/** The background check behind the field icon's badge: the same text + url as detection. */
export type CheckBody = DetectBody;

export interface CheckOk {
  /** How many grammar, spelling and punctuation errors the text has; 9 means 9 or more. */
  errors: number;
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

/**
 * `mistyped` / `gibberish` (422): the guard in front of every provider route found the text is no
 * language -- typed on the wrong keyboard layout (`ghbdtn` for `привет`), or random keystrokes.
 */
export type ApiErrorCode = 'invalid-input' | 'unauthenticated' | 'rate-limited' | 'not-found' | 'provider-failed' | 'mistyped' | 'gibberish';

export interface TranslateErr {
  error: { message: string; code: ApiErrorCode };
}

/** User settings, stored server-side on `profiles.settings` and cached in chrome.storage. */
export interface Settings {
  /** Language codes shown in the in-page menu, in order. Empty = not chosen yet: the extension
   * falls back to the browser's languages, which only it can see. */
  favoriteLanguages: string[];
  /** Hostnames where the extension stays off; a subdomain matches its parent (example.com covers mail.example.com). */
  disabledSites: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  favoriteLanguages: [],
  disabledSites: [],
};

export interface Language {
  code: string;
  name: string;
  /** "Translating to <this language>", written in the language itself: the busy label speaks the target language. */
  translating: string;
}

/** A bare hostname, lower case: no scheme, port or path. */
export const HOSTNAME = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;

/** Language code, e.g. "de" or "pt-BR". Shared by targetLang and favoriteLanguages validation. */
export const LANGUAGE_CODE = /^[a-zA-Z-]{2,8}$/;

export const MAX_TEXT_LENGTH = 5000;
export const MAX_FAVORITE_LANGUAGES = 20;
export const MAX_DISABLED_SITES = 100;
export const MAX_URL_LENGTH = 2048;
