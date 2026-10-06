import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { insertIntoFocusedField, isInsertMessage } from '../content/insert';
import { mountMeeting } from '../widgets/meeting/mount';
import { mountTranslator } from '../widgets/translator/mount';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',

  main(ctx) {
    ctx.onInvalidated(mountTranslator({ isInvalid: () => ctx.isInvalid }));
    // Meeting mode is UI only for now: a scripted demo. It opens from the popup's History → Meetings
    // Start (shown in dev builds only), or by itself on playground/meeting.html in dev builds.
    let unmountMeeting: (() => void) | null = null;
    const startMeeting = () => {
      unmountMeeting ??= mountMeeting(() => (unmountMeeting = null));
    };
    if (import.meta.env.DEV && window === window.top && document.documentElement.dataset['aiTranslatorMeeting'] === 'demo') startMeeting();
    ctx.onInvalidated(() => unmountMeeting?.());

    // The popup's tab messages. Start meeting: the top frame answers. Insert: every frame gets it;
    // only the one holding the focused field answers, so the popup's promise resolves with that
    // answer (or undefined when no frame has a field).
    const onMessage = (message: unknown, _sender: unknown, sendResponse: (done: boolean) => void) => {
      if ((message as { type?: unknown } | null)?.type === 'start-meeting') {
        if (window !== window.top) return;
        startMeeting();
        return sendResponse(true);
      }
      if (!isInsertMessage(message) || !insertIntoFocusedField(document, message.text)) return;
      sendResponse(true);
    };
    browser.runtime.onMessage.addListener(onMessage);
    ctx.onInvalidated(() => browser.runtime.onMessage.removeListener(onMessage));
  },
});
