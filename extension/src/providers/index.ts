import type { TranslatorRegistry } from '../core/registry';
import { apiTranslatorFactory } from './api/api-translator';
import { mockTranslatorFactory } from './mock/mock-translator';

/** Composition point: register every available provider here. */
export function registerProviders(registry: TranslatorRegistry): TranslatorRegistry {
  return registry.register(apiTranslatorFactory).register(mockTranslatorFactory);
}
