import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { insertIntoFocusedField, isInsertMessage } from '../content/insert';
import { mountTranslator } from '../content/ui/translator-widget';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',

  main(ctx) {
    ctx.onInvalidated(mountTranslator({ isInvalid: () => ctx.isInvalid }));

    // The popup's Insert. Every frame gets it; only the one holding the focused field answers,
    // so the popup's promise resolves with that answer (or undefined when no frame has a field).
    const onInsert = (message: unknown, _sender: unknown, sendResponse: (inserted: boolean) => void) => {
      if (!isInsertMessage(message) || !insertIntoFocusedField(document, message.text)) return;
      sendResponse(true);
    };
    browser.runtime.onMessage.addListener(onInsert);
    ctx.onInvalidated(() => browser.runtime.onMessage.removeListener(onInsert));
  },
});
