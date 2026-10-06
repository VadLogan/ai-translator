import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
// See widgets/translator/mount.ts: the theme goes into the closed shadow root as a <style>.
import WIDGET_CSS from '../../components/theme.css?inline';
import { remToPx, withPropertyDefaults } from '../translator/shadow-css';
import { Meeting } from './Meeting';

/** Renders the meeting card into its own closed shadow root on <html>. Returns the teardown; `onClosed` runs after either way of closing. */
export function mountMeeting(onClosed: () => void = () => undefined): () => void {
  const host = document.createElement('ai-translator-meeting');
  host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647;';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = remToPx(withPropertyDefaults(WIDGET_CSS));
  const container = document.createElement('div');
  shadow.append(style, container);

  // Same rules as the translator's host: keep focus in the page's field (except our own text
  // input, the speaker rename), and keep clicks and keys from reaching the page's handlers.
  shadow.addEventListener('mousedown', (event) => {
    if (!(event.target instanceof HTMLInputElement && event.target.type === 'text')) event.preventDefault();
  });
  for (const type of ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'keydown', 'keyup', 'keypress']) {
    host.addEventListener(type, (event) => event.stopPropagation());
  }

  document.documentElement.append(host);
  const root = createRoot(container);
  const teardown = () => {
    queueMicrotask(() => root.unmount());
    host.remove();
    onClosed();
  };
  root.render(createElement(Meeting, { onClose: teardown }));
  return teardown;
}
