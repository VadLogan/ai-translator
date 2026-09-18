import type { TranslateErr, TranslateOk } from '../../../../shared/contract';
import {
  TranslationError,
  type TranslateRequest,
  type TranslateResult,
  type Translator,
  type TranslatorFactory,
} from '../../core/translator';

const BASE_URL = import.meta.env.WXT_API_URL ?? 'http://127.0.0.1:8787';

/** Talks to the backend API; the provider key lives there, never in the extension. */
export class ApiTranslator implements Translator {
  constructor(private readonly baseUrl: string) {}

  async translate(request: TranslateRequest): Promise<TranslateResult> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch (error) {
      throw new TranslationError(
        `Cannot reach the translation API at ${this.baseUrl}. Is it running?`,
        'provider-failed',
        { cause: error },
      );
    }

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = (body as TranslateErr | null)?.error?.message ?? `API returned ${response.status}`;
      throw new TranslationError(message, response.status === 400 ? 'invalid-input' : 'provider-failed');
    }
    return body as TranslateOk;
  }
}

export const apiTranslatorFactory: TranslatorFactory<{ baseUrl?: string }> = {
  id: 'api',
  displayName: 'Translation API',
  create: (config) => new ApiTranslator(config?.baseUrl ?? BASE_URL),
};
