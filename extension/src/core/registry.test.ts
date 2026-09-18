import { describe, expect, it } from 'vitest';
import { TranslatorRegistry } from './registry';
import { TranslationError, type TranslatorFactory } from './translator';

const factory = (id: string): TranslatorFactory => ({
  id,
  displayName: `Provider ${id}`,
  create: () => ({ translate: async ({ text }) => ({ text }) }),
});

describe('TranslatorRegistry', () => {
  it('returns registered factories by id', () => {
    const a = factory('a');
    const registry = new TranslatorRegistry().register(a).register(factory('b'));

    expect(registry.get('a')).toBe(a);
    expect(registry.list()).toEqual([
      { id: 'a', displayName: 'Provider a' },
      { id: 'b', displayName: 'Provider b' },
    ]);
  });

  it('rejects duplicate ids', () => {
    const registry = new TranslatorRegistry().register(factory('a'));
    expect(() => registry.register(factory('a'))).toThrow(/already registered/);
  });

  it('throws unknown-provider for missing ids', () => {
    const registry = new TranslatorRegistry();
    expect(() => registry.get('nope')).toThrow(TranslationError);
    try {
      registry.get('nope');
    } catch (error) {
      expect((error as TranslationError).code).toBe('unknown-provider');
    }
  });
});
