import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Language } from '../../core/languages';
import type { Anchor } from '../selection';
import { TranslatorWidget as WidgetView_, type WidgetCallbacks, type WidgetView } from './TranslatorWidget';
// Processed by the Tailwind Vite plugin and handed back as a string, so it can go straight into a
// <style> inside the shadow root instead of leaking into the page as a stylesheet.
import WIDGET_CSS from '../../ui/theme.css?inline';

export type { WidgetCallbacks };

/**
 * Floating icon + language menu, isolated from page CSS in a closed shadow root.
 *
 * The class is a thin imperative facade over the React component: every show*() sets the view and
 * re-renders. The content script drives it exactly as before.
 */
export class TranslatorWidget {
  private readonly host: HTMLElement;
  private readonly root: Root;
  private view: WidgetView = { kind: 'hidden' };
  private anchor: Anchor = { x: 0, top: 0, bottom: 0 };
  private dark = matchMedia('(prefers-color-scheme: dark)').matches;

  constructor(
    private readonly callbacks: WidgetCallbacks,
    private readonly doc: Document = document,
  ) {
    this.host = doc.createElement('ai-translator-widget');
    this.host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647;';
    const shadow = this.host.attachShadow({ mode: 'closed' });

    const style = doc.createElement('style');
    style.textContent = WIDGET_CSS;

    const container = doc.createElement('div');
    shadow.append(style, container);
    this.root = createRoot(container);

    // Keep focus and the text selection in the page's input while clicking the widget.
    shadow.addEventListener('mousedown', (event) => event.preventDefault());
    // Don't let the page treat clicks on the widget as "outside clicks".
    for (const type of ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup']) {
      this.host.addEventListener(type, (event) => event.stopPropagation());
    }

    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      this.dark = event.matches;
      this.render();
    });

    this.render();
  }

  mount(): void {
    if (!this.host.isConnected) this.doc.documentElement.append(this.host);
  }

  destroy(): void {
    // Unmount asynchronously: React refuses to tear a root down from inside a render or effect,
    // and destroy() runs from WXT's onInvalidated.
    const root = this.root;
    queueMicrotask(() => root.unmount());
    this.host.remove();
  }

  get isMenuOpen(): boolean {
    return this.view.kind !== 'hidden' && this.view.kind !== 'icon';
  }

  get isVisible(): boolean {
    return this.view.kind !== 'hidden';
  }

  owns(event: Event): boolean {
    return event.composedPath().includes(this.host);
  }

  showIcon(anchor: Anchor): void {
    this.anchor = anchor;
    this.show({ kind: 'icon' });
  }

  /**
   * `layoutPreview` is the selection re-typed on the other keyboard layout, offered as an item so a
   * mistyped selection is always one click from fixed -- the menu does not wait to be told it is
   * wrong. `detectedName` is left out while detection is still in flight; showDetected() fills it in.
   */
  showLanguages(languages: readonly Language[], layoutPreview?: string, detectedName?: string): void {
    this.show({ kind: 'languages', languages, layoutPreview, detectedName });
  }

  /**
   * Fills in the "From:" line once detection answers. Only the line changes, so React keeps the
   * panel node -- a rebuild would re-measure and move the menu under the user's cursor. A no-op if
   * the panel moved on (busy, error, sign-in). `lang` is left out for "unknown" and "wrong keyboard
   * layout", so the Rewrite section (which needs a real source language) stays hidden for those.
   */
  showDetected(name: string, lang?: string): void {
    if (this.view.kind !== 'languages') return;
    this.show({ ...this.view, detectedName: name, detectedLang: lang });
  }

  showBusy(languageName: string): void {
    this.show({ kind: 'busy', languageName });
  }

  /** Same shape as showError, but the buttons start the OAuth flow instead of going back. */
  showSignIn(providers: readonly { id: string; name: string }[], onPick: (providerId: string) => void): void {
    this.show({ kind: 'signIn', providers, onPick });
  }

  showError(message: string, onBack: () => void): void {
    this.show({ kind: 'error', message, onBack });
  }

  hide(): void {
    this.view = { kind: 'hidden' };
    this.render();
  }

  private show(view: WidgetView): void {
    this.mount();
    this.view = view;
    this.render();
  }

  private render(): void {
    this.root.render(
      createElement(WidgetView_, { view: this.view, anchor: this.anchor, dark: this.dark, callbacks: this.callbacks }),
    );
  }
}
