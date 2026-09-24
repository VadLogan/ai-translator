import { defineContentScript } from 'wxt/utils/define-content-script';
import { mountTranslator } from '../content/ui/translator-widget';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',

  main(ctx) {
    ctx.onInvalidated(mountTranslator({ isInvalid: () => ctx.isInvalid }));
  },
});
