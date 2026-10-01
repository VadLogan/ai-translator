import { browser, type Browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { ApiError, check, detect, fixGrammar, getSettings, rewrite, reportDictation, saveSettings, transcribe, translate, voiceSession } from '../api';
import { getAccessToken, signIn, signOut } from '../auth/oauth';
import { storageSession } from '../auth/session';
import { isMessage, type Account, type Message, type Response } from '../messaging/messages';
import { isVoiceLevel, type RecorderMessage, type RecorderReply, type VoiceOwner } from '../messaging/recorder';
import { storageSettings } from '../settings/storage-settings';

export default defineBackground(() => {
  // In-flight grammar checks, fixes and field translations by the content script's id. The fetch lives here, so only the worker can abort it.
  const checks = new Map<string, AbortController>();

  async function handle(message: Message, sender: Browser.runtime.MessageSender): Promise<Response<unknown>> {
    try {
      switch (message.type) {
        case 'translate': {
          // Fetched here, not in the content script: host_permissions exempt the worker from page CORS.
          // The url comes from the sender, not the message: the browser fills it in, so a
          // compromised page can't forge where the extension was used. Only a tab has one: the
          // toolbar popup and the options page are not a site, so they send no url.
          const controller = new AbortController();
          if (message.id) checks.set(message.id, controller);
          try {
            return {
              ok: true,
              data: await asUser((token) =>
                translate(
                  {
                    text: message.text,
                    targetLang: message.targetLang,
                    ...(message.sourceLang ? { sourceLang: message.sourceLang } : {}),
                    url: sender.tab?.url,
                  },
                  token,
                  controller.signal,
                ),
              ),
            };
          } finally {
            if (message.id) checks.delete(message.id);
          }
        }
        case 'detect':
          // Same reasons as translate, url included.
          return {
            ok: true,
            data: await asUser((token) => detect({ text: message.text, url: sender.tab?.url }, token)),
          };
        case 'fix-grammar':
        case 'check': {
          const controller = new AbortController();
          checks.set(message.id, controller);
          const body = { text: message.text, url: sender.tab?.url };
          try {
            return {
              ok: true,
              data: await asUser<unknown>((token) =>
                message.type === 'check'
                  ? check(body, token, controller.signal)
                  : fixGrammar({ ...body, ...(message.guarded ? { guarded: true } : {}) }, token, controller.signal),
              ),
            };
          } finally {
            checks.delete(message.id);
          }
        }
        case 'cancel':
          checks.get(message.id)?.abort(); // unknown id: already answered, nothing to stop
          return { ok: true, data: undefined };
        case 'rewrite':
          return {
            ok: true,
            data: await asUser((token) =>
              rewrite({ text: message.text, style: message.style, url: sender.tab?.url }, token),
            ),
          };
        case 'voice-start': {
          await ensureRecorder();
          // The recorder's level messages are forwarded to the dictating frame; the popup hears them itself.
          const owner = sender.tab?.id === undefined ? undefined : { tabId: sender.tab.id, frameId: sender.frameId ?? 0 };
          const { error } = await record('start', owner);
          if (error === 'mic-blocked') {
            // The offscreen recorder can't prompt; the options page can, once, for the whole extension.
            await browser.tabs.create({ url: browser.runtime.getURL('/options.html#mic') });
            return { ok: false, error: { message: 'Allow the microphone in the tab that just opened, then try again.', code: 'mic-blocked' } };
          }
          if (error) return { ok: false, error: { message: 'Could not start the microphone.' } };
          // Live text: the secret is minted while the recorder already listens (it buffers). A
          // failure is silent -- Stop then sends the file to /transcribe.
          void asUser(voiceSession)
            .then(({ secret, model }) => record('live', owner, secret, model))
            .catch(() => {});
          return { ok: true, data: undefined };
        }
        case 'voice-stop': {
          const { audio, seconds, text, model, error } = await record('stop');
          // The dev stats: the recording's seconds, its transcript's words and the model that made it,
          // once that is known. Not awaited, and a failure never reaches the user.
          const report = (said = '', by?: string) => {
            const words = said.trim() ? said.trim().split(/\s+/).length : 0;
            if (seconds) void asUser((token) => reportDictation({ seconds, words, ...(by ? { model: by } : {}) }, token)).catch(() => {});
          };
          // The live session heard it all: only the language is left -- known already when the UI
          // detected it on the live text, else asked now ("und" when that fails).
          if (text) {
            report(text, model);
            const lang = message.lang ?? (await asUser((token) => detect({ text, url: sender.tab?.url }, token)).then(({ lang }) => lang, () => 'und'));
            return { ok: true, data: { text, lang } };
          }
          if (!audio || error) {
            report();
            return { ok: false, error: { message: 'Nothing was recorded.' } };
          }
          const blob = await (await fetch(audio)).blob();
          const form = new FormData();
          form.set('audio', blob, 'speech.webm');
          if (sender.tab?.url) form.set('url', sender.tab.url);
          try {
            const transcribed = await asUser((token) => transcribe(form, token));
            report(transcribed.text, transcribed.model);
            return { ok: true, data: transcribed };
          } catch (transcribeError) {
            report(); // the time was spent all the same
            throw transcribeError;
          }
        }
        case 'voice-cancel':
          await record('cancel').catch(() => {}); // no recorder yet: nothing to cancel
          return { ok: true, data: undefined };
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
    if (isVoiceLevel(message)) {
      const { owner } = message;
      if (owner) browser.tabs.sendMessage(owner.tabId, message, { frameId: owner.frameId }).catch(() => {}); // the tab went away
      return;
    }
    if (!isMessage(message)) return;
    handle(message, sender).then(sendResponse);
    return true; // keep the channel open for the async response
  });

  if (import.meta.env.DEV) void reloadPlaygroundWhenReady();
});

/** The offscreen recorder (entrypoints/offscreen), created on the first dictation and kept. */
async function ensureRecorder(): Promise<void> {
  const contexts = await browser.runtime.getContexts({ contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT] });
  if (contexts.length) return;
  await browser.offscreen.createDocument({
    url: '/offscreen.html',
    reasons: [browser.offscreen.Reason.USER_MEDIA],
    justification: 'Records voice input for transcription',
  });
}

const record = (type: RecorderMessage['type'], owner?: VoiceOwner, secret?: string, model?: string): Promise<RecorderReply> =>
  browser.runtime.sendMessage({ target: 'offscreen', type, ...(owner ? { owner } : {}), ...(secret ? { secret } : {}), ...(model ? { model } : {}) } satisfies RecorderMessage);

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
