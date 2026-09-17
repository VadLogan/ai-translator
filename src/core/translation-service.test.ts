import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings';
import { TranslatorRegistry } from './registry';
import { TranslationService } from './translation-service';
import { TranslationError, type Translator } from './translator';

function setup(translator: Translator, overrides: Partial<Settings> = {}) {
  const create = vi.fn(() => translator);
  const registry = new TranslatorRegistry().register({ id: 'fake', displayName: 'Fake', create });
  const settings = { get: async () => ({ ...DEFAULT_SETTINGS, activeProviderId: 'fake', ...overrides }) };
  return { service: new TranslationService(registry, settings), create };
}

describe('TranslationService', () => {
  it('uses the active provider with its stored config', async () => {
    const translate = vi.fn(async () => ({ text: 'Hallo' }));
    const { service, create } = setup({ translate }, { providerConfigs: { fake: { apiKey: 'k' } } });

    await expect(service.translate('Hello', 'de')).resolves.toEqual({ text: 'Hallo' });
    expect(create).toHaveBeenCalledWith({ apiKey: 'k' });
    expect(translate).toHaveBeenCalledWith({ text: 'Hello', targetLang: 'de' });
  });

  it('rejects blank text without calling the provider', async () => {
    const translate = vi.fn();
    const { service } = setup({ translate });

    await expect(service.translate('   ', 'de')).rejects.toMatchObject({ code: 'invalid-input' });
    expect(translate).not.toHaveBeenCalled();
  });

  it('wraps provider failures', async () => {
    const { service } = setup({ translate: async () => Promise.reject(new Error('quota exceeded')) });

    const error = await service.translate('Hello', 'de').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TranslationError);
    expect(error).toMatchObject({ code: 'provider-failed', message: 'Translation failed: quota exceeded' });
  });

  it('reports an unknown active provider', async () => {
    const { service } = setup({ translate: vi.fn() }, { activeProviderId: 'removed' });
    await expect(service.translate('Hello', 'de')).rejects.toMatchObject({ code: 'unknown-provider' });
  });
});
