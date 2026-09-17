import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { TranslatorRegistry } from '../core/registry';
import { TranslationError } from '../core/translator';
import { TranslationService } from '../core/translation-service';
import { isMessage, type Message, type Response } from '../messaging/messages';
import { registerProviders } from '../providers';
import { storageSettings } from '../settings/storage-settings';

export default defineBackground(() => {
  // Composition root: the only place concrete providers and storage are wired in.
  const registry = registerProviders(new TranslatorRegistry());
  const translationService = new TranslationService(registry, storageSettings);

  async function handle(message: Message): Promise<Response<unknown>> {
    try {
      switch (message.type) {
        case 'translate':
          return { ok: true, data: await translationService.translate(message.text, message.targetLang) };
        case 'list-providers':
          return { ok: true, data: registry.list() };
        case 'open-options':
          await browser.runtime.openOptionsPage();
          return { ok: true, data: undefined };
      }
    } catch (error) {
      if (error instanceof TranslationError) {
        return { ok: false, error: { message: error.message, code: error.code } };
      }
      return { ok: false, error: { message: error instanceof Error ? error.message : String(error) } };
    }
  }

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isMessage(message)) return;
    handle(message).then(sendResponse);
    return true; // keep the channel open for the async response
  });

  browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  if (import.meta.env.DEV) void reloadPlaygroundWhenReady();
});

/**
 * In dev, WXT registers content scripts at runtime, after the start-URL tab has
 * already loaded, so that tab has no content script. Reload it once they exist.
 */
async function reloadPlaygroundWhenReady(): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    if ((await browser.scripting.getRegisteredContentScripts()).length > 0) {
      const tabs = await browser.tabs.query({ url: 'http://127.0.0.1:5555/*' });
      await Promise.all(tabs.map((tab) => tab.id !== undefined && browser.tabs.reload(tab.id)));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
