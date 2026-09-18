import { defineContentScript } from 'wxt/utils/define-content-script';
import { findLanguage, type Language } from '../core/languages';
import { replaceSelection } from '../content/replace';
import {
  getEditableSelection,
  getSelectionAnchorPoint,
  isSelectionUnchanged,
  type EditableSelection,
} from '../content/selection';
import { TranslatorWidget, type Point } from '../content/ui/translator-widget';
import { sendMessage } from '../messaging/messages';
import { storageSettings } from '../settings/storage-settings';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',

  main(ctx) {
    /** Selection captured when the icon appeared; the menu acts on this. */
    let snapshot: EditableSelection | null = null;
    /** Bumped on every close/new request so stale responses are ignored. */
    let requestId = 0;

    const widget = new TranslatorWidget({
      onIconClick: () => void showLanguages(),
      onLanguagePick: (code) => void translate(code),
      onOpenSettings: () => {
        close();
        void sendMessage({ type: 'open-options' });
      },
    });
    ctx.onInvalidated(() => widget.destroy());

    function close(): void {
      requestId++;
      snapshot = null;
      widget.hide();
    }

    function refresh(pointer?: Point): void {
      if (widget.isMenuOpen) return;
      const selection = getEditableSelection();
      if (!selection) {
        close();
        return;
      }
      snapshot = selection;
      widget.showIcon(pointer ?? getSelectionAnchorPoint(selection));
    }

    async function showLanguages(): Promise<void> {
      const { favoriteLanguages } = await storageSettings.get();
      widget.showLanguages(favoriteLanguages.map(findLanguage).filter((l): l is Language => l !== undefined));
    }

    async function translate(targetLang: string): Promise<void> {
      const current = snapshot;
      if (!current) return;
      const id = ++requestId;
      widget.showBusy(findLanguage(targetLang)?.name ?? targetLang);

      const response = await sendMessage({ type: 'translate', text: current.text, targetLang });
      if (id !== requestId) return; // closed or superseded meanwhile

      if (!response.ok) {
        widget.showError(response.error.message, () => void showLanguages());
      } else if (!isSelectionUnchanged(current)) {
        widget.showError('The text changed while translating. Select it again.', () => void showLanguages());
      } else {
        replaceSelection(current, response.data.text);
        close();
      }
    }

    ctx.addEventListener(document, 'mousedown', (event) => {
      if (!widget.owns(event)) close();
    });
    ctx.addEventListener(document, 'mouseup', (event) => {
      if (widget.owns(event)) return;
      const pointer = { x: event.clientX, y: event.clientY };
      // Let the browser finalize the selection first.
      setTimeout(() => refresh(pointer), 0);
    });
    ctx.addEventListener(document, 'keydown', (event) => {
      if (event.key === 'Escape' && widget.isVisible) close();
    });
    ctx.addEventListener(document, 'keyup', (event) => {
      if (event.key !== 'Escape') refresh();
    });
    ctx.addEventListener(window, 'scroll', () => widget.isVisible && close(), { capture: true, passive: true });
    ctx.addEventListener(window, 'resize', () => widget.isVisible && close());
  },
});
