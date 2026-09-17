export interface TranslateRequest {
  text: string;
  /** BCP-47-ish language code, e.g. "en", "uk", "de". */
  targetLang: string;
  /** Omit to let the provider auto-detect. */
  sourceLang?: string;
}

export interface TranslateResult {
  text: string;
  detectedSourceLang?: string;
}

/** The abstraction every translation engine implements. */
export interface Translator {
  translate(request: TranslateRequest): Promise<TranslateResult>;
}

/**
 * Describes a provider and builds a configured Translator.
 * `config` is whatever the provider stores in settings (API key, model, ...).
 */
export interface TranslatorFactory<TConfig = unknown> {
  readonly id: string;
  readonly displayName: string;
  create(config: TConfig | undefined): Translator;
}

export type TranslationErrorCode = 'invalid-input' | 'unknown-provider' | 'provider-failed';

export class TranslationError extends Error {
  constructor(
    message: string,
    readonly code: TranslationErrorCode,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'TranslationError';
  }
}
