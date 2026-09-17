import type { TranslatorRegistry } from './registry';
import { TranslationError, type TranslateResult } from './translator';
import type { SettingsReader } from '../settings/settings';

export class TranslationService {
  constructor(
    private readonly registry: TranslatorRegistry,
    private readonly settings: SettingsReader,
  ) {}

  async translate(text: string, targetLang: string): Promise<TranslateResult> {
    if (!text.trim()) {
      throw new TranslationError('Nothing to translate', 'invalid-input');
    }

    const { activeProviderId, providerConfigs } = await this.settings.get();
    // Built per request so config changes in settings apply immediately.
    const translator = this.registry.get(activeProviderId).create(providerConfigs[activeProviderId]);

    try {
      return await translator.translate({ text, targetLang });
    } catch (error) {
      if (error instanceof TranslationError) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      throw new TranslationError(`Translation failed: ${reason}`, 'provider-failed', { cause: error });
    }
  }
}
