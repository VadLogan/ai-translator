import type { TranslatorRegistry } from '../core/registry';
import { mockTranslatorFactory } from './mock/mock-translator';

/** Composition point: register every available provider here. */
export function registerProviders(registry: TranslatorRegistry): TranslatorRegistry {
  return registry.register(mockTranslatorFactory);
}
