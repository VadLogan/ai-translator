import { browser, type Browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { ApiError, detect, getSettings, saveSettings, translate } from '../api';
import { getAccessToken, signIn, signOut } from '../auth/oauth';
import { storageSession } from '../auth/session';
import { isMessage, type Account, type Message, type Response } from '../messaging/messages';
import { storageSettings } from '../settings/storage-settings';

export default defineBackground(() => {
  async function handle(message: Message, sender: Browser.runtime.MessageSender): Promise<Response<unknown>> {
    try {
      switch (message.type) {
        case 'translate':
          // Fetched here, not in the content script: host_permissions exempt the worker from page CORS.
          // The url comes from the sender, not the message: the browser fills it in, so a
          // compromised page can't forge where the extension was used.
          return {
            ok: true,
            data: await asUser((token) =>
              translate(
                {
                  text: message.text,
                  targetLang: message.targetLang,
                  ...(message.sourceLang ? { sourceLang: message.sourceLang } : {}),
                  url: sender.tab?.url ?? sender.url,
                },
                token,
              ),
            ),
          };
        case 'detect':
          // Same reasons as translate, url included.
          return {
            ok: true,
            data: await asUser((token) => detect({ text: message.text, url: sender.tab?.url ?? sender.url }, token)),
          };
        case 'open-options':
          await browser.runtime.openOptionsPage();
          return { ok: true, data: undefined };
        case 'sign-in': {
          const account = accountFrom(await signIn(message.provider));
          // Pull the server's settings straight into the cache: this is what makes a second
          // machine show the right languages without opening the options page first.
          await pullSettings();
          return { ok: true, data: account };
        }
        case 'sign-out':
          await signOut();
          return { ok: true, data: undefined };
        case 'get-account': {
          const session = await storageSession.get();
          return { ok: true, data: session ? accountFrom(session) : null };
        }
        case 'get-settings':
          return { ok: true, data: await pullSettings() };
        case 'save-settings': {
          // API first, cache second, so the server stays authoritative if the write fails.
          const saved = await saveSettings(message.settings, await getAccessToken());
          await storageSettings.update(saved);
          return { ok: true, data: saved };
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const code = error instanceof ApiError ? error.code : undefined;
      return { ok: false, error: { message: reason, ...(code ? { code } : {}) } };
    }
  }

  /**
   * Server is the source of truth; chrome.storage is a cache the content script reads on every
   * icon click. A signed-out or unreachable API falls back to the cache rather than erroring,
   * so nobody is locked out of their own language list.
   */
  async function pullSettings() {
    try {
      return await storageSettings.update(await getSettings(await getAccessToken()));
    } catch {
      return await storageSettings.get();
    }
  }

  /**
   * Runs an API call with a fresh access token. getAccessToken() already refreshes a token that is
   * near expiry, so a 401 here means the session is genuinely dead (revoked, or the refresh token
   * expired). Drop it so the next attempt prompts a sign-in instead of replaying a token the API
   * keeps rejecting.
   */
  async function asUser<T>(call: (accessToken: string | null) => Promise<T>): Promise<T> {
    try {
      return await call(await getAccessToken());
    } catch (error) {
      if (error instanceof ApiError && error.code === 'unauthenticated') await storageSession.clear();
      throw error;
    }
  }

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isMessage(message)) return;
    handle(message, sender).then(sendResponse);
    return true; // keep the channel open for the async response
  });

  browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  if (import.meta.env.DEV) void reloadPlaygroundWhenReady();
});

const accountFrom = ({ email }: { email?: string }): Account => (email ? { email } : {});

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
