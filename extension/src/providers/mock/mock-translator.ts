import type { TranslateRequest, TranslateResult, Translator, TranslatorFactory } from '../../core/translator';

/** Offline fallback: exercises the UI flow with no API running. */
export class MockTranslator implements Translator {
  constructor(private readonly delayMs = 300) {}

  async translate({ text, targetLang }: TranslateRequest): Promise<TranslateResult> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return { text: `[${targetLang}] ${text}` };
  }
}

export const mockTranslatorFactory: TranslatorFactory = {
  id: 'mock',
  displayName: 'Mock (for testing)',
  create: () => new MockTranslator(),
};
