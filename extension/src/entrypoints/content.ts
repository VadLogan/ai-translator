import { defineContentScript } from 'wxt/utils/define-content-script';
import { switchLayout } from '../core/layout';
import { findLanguage, type Language } from '../core/languages';
import { PROVIDERS, isProviderId } from '../auth/providers';
import { replaceSelection } from '../content/replace';
import {
  getEditableSelection,
  getSelectionAnchor,
  isSelectionUnchanged,
  type EditableSelection,
} from '../content/selection';
import { TranslatorWidget } from '../content/ui/translator-widget';
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
    /** What POST /detect said the selection is written in, and what translate() sends back. */
    let detectedLang: string | null = null;

    const widget = new TranslatorWidget({
      onIconClick: () => void showLanguages(),
      onLanguagePick: (code) => void translate(code),
      onFixLayout: () => fixLayout(),
      onOpenSettings: () => {
        close();
        void sendMessage({ type: 'open-options' });
      },
    });
    ctx.onInvalidated(() => widget.destroy());

    function close(): void {
      requestId++;
      snapshot = null;
      detectedLang = null;
      widget.hide();
    }

    function refresh(): void {
      // After an extension reload or update this script is orphaned: every chrome.* call throws
      // "Extension context invalidated". Reading isInvalid lets WXT notice, remove our listeners
      // and fire onInvalidated, so the stale copy goes quiet.
      if (ctx.isInvalid || widget.isMenuOpen) return;
      const selection = getEditableSelection();
      if (!selection) {
        close();
        return;
      }
      // A different selection is a different language question.
      if (selection.text !== snapshot?.text) detectedLang = null;
      snapshot = selection;
      widget.showIcon(getSelectionAnchor(selection));
    }

    async function showLanguages(): Promise<void> {
      const id = requestId;
      try {
        // The cache answers immediately; the menu must not wait on the network to open.
        const { favoriteLanguages } = await storageSettings.get();
        const fixed = snapshot ? switchLayout(snapshot.text) : '';
        widget.showLanguages(
          favoriteLanguages.map(findLanguage).filter((l): l is Language => l !== undefined),
          fixed && fixed !== snapshot?.text ? preview(fixed) : undefined,
          detectedLang ? languageName(detectedLang) : undefined,
        );
      } catch {
        // Only fails when the extension was reloaded while the icon was showing.
        widget.showError('The extension was updated. Reload the page.', close);
        return;
      }
      if (!detectedLang) void detect(id);
    }

    /** Fills in the menu's "From:" line. Failures stay silent -- translating does not depend on it. */
    async function detect(id: number): Promise<void> {
      const current = snapshot;
      if (!current) return;

      const response = await sendMessage({ type: 'detect', text: current.text });
      if (id !== requestId) return; // closed or superseded meanwhile

      // Not a language at all: point at the fix item already sitting in the menu.
      if (response.ok && response.data.mistyped) {
        detectedLang = null;
        widget.showDetected('wrong keyboard layout');
        return;
      }

      const lang = response.ok ? response.data.lang : null;
      // "und" is the provider saying it could not tell, so it must not travel on as a sourceLang.
      detectedLang = lang && lang !== 'und' ? lang : null;
      widget.showDetected(detectedLang ? languageName(detectedLang) : 'unknown');
    }

    /** Re-types the selection on the other keyboard layout. No API call, no translation. */
    function fixLayout(): void {
      const current = snapshot;
      if (!current) return;
      if (!isSelectionUnchanged(current)) {
        widget.showError('The text changed. Select it again.', () => void showLanguages());
        return;
      }
      replaceSelection(current, switchLayout(current.text));
      close();
    }

    async function translate(targetLang: string): Promise<void> {
      const current = snapshot;
      if (!current) return;
      const id = ++requestId;
      widget.showBusy(languageName(targetLang));

      // sourceLang is what the user translated with, so the API can mark the detection verified.
      const response = await sendMessage({
        type: 'translate',
        text: current.text,
        targetLang,
        ...(detectedLang ? { sourceLang: detectedLang } : {}),
      });
      if (id !== requestId) return; // closed or superseded meanwhile

      if (!response.ok) {
        if (response.error.code === 'unauthenticated') promptSignIn(targetLang);
        else widget.showError(response.error.message, () => void showLanguages());
      } else if (!isSelectionUnchanged(current)) {
        widget.showError('The text changed while translating. Select it again.', () => void showLanguages());
      } else {
        replaceSelection(current, response.data.text);
        close();
      }
    }

    /** The API rejected us: offer the providers, then resume the translation that was interrupted. */
    function promptSignIn(targetLang: string): void {
      widget.showSignIn(PROVIDERS, (provider) => {
        if (!isProviderId(provider)) return;
        widget.showBusy(languageName(targetLang));
        void sendMessage({ type: 'sign-in', provider }).then((response) => {
          if (!response.ok) widget.showError(response.error.message, () => promptSignIn(targetLang));
          else void translate(targetLang);
        });
      });
    }

    const languageName = (code: string): string => findLanguage(code)?.name ?? code;

    const preview = (text: string): string => (text.length > 28 ? `${text.slice(0, 28)}…` : text);

    ctx.addEventListener(document, 'mousedown', (event) => {
      if (!widget.owns(event)) close();
    });
    ctx.addEventListener(document, 'mouseup', (event) => {
      if (widget.owns(event)) return;
      // Let the browser finalize the selection first.
      setTimeout(refresh, 0);
    });
    ctx.addEventListener(document, 'keydown', (event) => {
      if (event.key === 'Escape' && widget.isVisible) close();
    });
    ctx.addEventListener(document, 'keyup', (event) => {
      // Deferred like mouseup: model-based editors (Lexical, ProseMirror) move the selection
      // after the key event, so reading it synchronously would miss it.
      if (event.key !== 'Escape') setTimeout(refresh, 0);
    });
    // Close only when the scroll moves the selected field: pages like Teams scroll unrelated
    // panes (chat list, typing indicators) constantly, which would otherwise kill the menu.
    ctx.addEventListener(
      window,
      'scroll',
      (event) => {
        const target = event.target;
        const movesField = target === document || (target instanceof Node && !!snapshot && target.contains(snapshot.element));
        if (widget.isVisible && movesField) close();
      },
      { capture: true, passive: true },
    );
    ctx.addEventListener(window, 'resize', () => widget.isVisible && close());
  },
});
