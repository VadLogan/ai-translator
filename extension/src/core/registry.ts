import { TranslationError, type TranslatorFactory } from './translator';

export interface ProviderInfo {
  id: string;
  displayName: string;
}

export class TranslatorRegistry {
  private readonly factories = new Map<string, TranslatorFactory>();

  register(factory: TranslatorFactory): this {
    if (this.factories.has(factory.id)) {
      throw new Error(`Translator provider "${factory.id}" is already registered`);
    }
    this.factories.set(factory.id, factory);
    return this;
  }

  get(id: string): TranslatorFactory {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new TranslationError(
        `Translator provider "${id}" is not available. Choose another one in the extension settings.`,
        'unknown-provider',
      );
    }
    return factory;
  }

  list(): ProviderInfo[] {
    return [...this.factories.values()].map(({ id, displayName }) => ({ id, displayName }));
  }
}
