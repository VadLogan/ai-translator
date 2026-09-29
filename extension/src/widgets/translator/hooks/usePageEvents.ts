import { useEffect } from 'react';

export interface PageHandlers {
  close(): void;
  refresh(): void;
  onInput(): void;
  onKeyDown(event: KeyboardEvent): void;
  /** Focus moved into a page field. */
  onFocusIn(): void;
  /** The element the widget belongs to, so scrolling an unrelated pane doesn't close it. */
  selectedElement(): Element | undefined;
}

/**
 * The page's events, wired to the flow. Subscribed once: the handlers only touch refs and dispatch,
 * so the first render's closures stay correct. Events inside `host` are the widget's own.
 */
export function usePageEvents(host: HTMLElement, handlers: PageHandlers): void {
  useEffect(() => {
    const { close, refresh, onInput, onKeyDown, onFocusIn, selectedElement } = handlers;
    const owns = (event: Event) => event.composedPath().includes(host);
    const listeners: [EventTarget, string, (event: Event) => void, AddEventListenerOptions?][] = [
      [document, 'mousedown', (event) => !owns(event) && close()],
      // Deferred: let the browser finalize the selection first.
      [document, 'mouseup', (event) => !owns(event) && setTimeout(refresh, 0)],
      [document, 'keydown', (event) => onKeyDown(event as KeyboardEvent), { capture: true }],
      [document, 'input', (event) => !owns(event) && onInput(), { capture: true }],
      // Model-based editors (CKEditor in Teams, ProseMirror, Lexical) cancel beforeinput and edit
      // the DOM themselves, so `input` never fires there. Deferred: the text changes after this event.
      // Plain fields get both; onInput is idempotent for the same text.
      [document, 'beforeinput', (event) => !owns(event) && setTimeout(onInput, 0), { capture: true }],
      // Focus alone (tabbing in, or clicking an empty field) shows the field's corner icon.
      [document, 'focusin', (event) => !owns(event) && onFocusIn()],
      // Pressing the icon moves focus into the widget; that is not leaving the field.
      [document, 'focusout', (event) => (event as FocusEvent).relatedTarget !== host && setTimeout(refresh, 0)],
      // Deferred like mouseup: model-based editors (Lexical, ProseMirror) move the selection after
      // the key event, so reading it synchronously would miss it.
      [document, 'keyup', (event) => (event as KeyboardEvent).key !== 'Escape' && setTimeout(refresh, 0)],
      // Close only when the scroll moves the selected field: pages like Teams scroll unrelated panes
      // (chat list, typing indicators) constantly, which would otherwise kill the menu.
      [
        window,
        'scroll',
        (event) => {
          const { target } = event;
          const field = selectedElement();
          if (field && (target === document || (target instanceof Node && target.contains(field)))) close();
        },
        { capture: true, passive: true },
      ],
      [window, 'resize', () => close()],
    ];
    for (const [target, type, listener, options] of listeners) target.addEventListener(type, listener, options);
    return () => {
      for (const [target, type, listener, options] of listeners) target.removeEventListener(type, listener, options);
    };
  }, []);
}
