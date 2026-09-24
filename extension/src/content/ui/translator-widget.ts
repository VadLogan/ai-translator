import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Translator } from './Translator';
// Processed by the Tailwind Vite plugin and handed back as a string, so it can go straight into a
// <style> inside the shadow root instead of leaking into the page as a stylesheet.
import WIDGET_CSS from '../../ui/theme.css?inline';
import { remToPx, withPropertyDefaults } from './shadow-css';

/**
 * Renders the translator into a closed shadow root, isolated from page CSS. All behavior lives in
 * the Translator component; this only builds the host. Returns the teardown.
 */
export function mountTranslator({ isInvalid }: { isInvalid: () => boolean }): () => void {
  const host = document.createElement('ai-translator-widget');
  host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647;';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = remToPx(withPropertyDefaults(WIDGET_CSS));
  const container = document.createElement('div');
  shadow.append(style, container);

  // Keep focus and the text selection in the page's input while clicking the widget.
  shadow.addEventListener('mousedown', (event) => event.preventDefault());
  // Don't let the page treat clicks on the widget as "outside clicks".
  for (const type of ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup']) {
    host.addEventListener(type, (event) => event.stopPropagation());
  }

  const mount = () => {
    if (!host.isConnected) document.documentElement.append(host);
  };
  const root = createRoot(container);
  root.render(createElement(Translator, { host, mount, isInvalid }));

  return () => {
    // Unmount asynchronously: React refuses to tear a root down from inside a render or effect,
    // and this runs from WXT's onInvalidated.
    queueMicrotask(() => root.unmount());
    host.remove();
  };
}
