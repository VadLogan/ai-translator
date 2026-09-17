import type { TranslateRequest, TranslateResult, Translator, TranslatorFactory } from '../../core/translator';

/** Fake provider for exercising the UI flow without any API. */
export class MockTranslator implements Translator {
  constructor(private readonly delayMs = 300) {}

  async translate({ text, targetLang }: TranslateRequest): Promise<TranslateResult> {
    // Runs in the background worker: see chrome://extensions → "service worker" → Console.
    console.info(`[mock] ${new Date().toISOString()} translate to "${targetLang}":`, text);
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return { text: `[${targetLang}] ${text}` };
  }
}

export const mockTranslatorFactory: TranslatorFactory = {
  id: 'mock',
  displayName: 'Mock (for testing)',
  create: () => new MockTranslator(),
};
