import { useEffect } from 'react';

export interface PageHandlers {
  close(): void;
  refresh(): void;
  onInput(): void;
  /** The selected field's DOM changed, at most once a frame. */
  onMutation(): void;
  onKeyDown(event: KeyboardEvent): void;
  /** Focus moved into a page field. */
  onFocusIn(): void;
  /** The selected field moved: a scroll of it or of the page, or a resize. */
  onScroll(): void;
  /** The pointer moved, at most once a frame; `overWidget` = it is over the widget itself. */
  onPointer(x: number, y: number, overWidget: boolean): void;
  /** The element the widget belongs to, so scrolling an unrelated pane doesn't close it. */
  selectedElement(): Element | undefined;
}

/**
 * The page's events, wired to the flow. Subscribed once: the handlers only touch refs and dispatch,
 * so the first render's closures stay correct. Events inside `host` are the widget's own.
 */
export function usePageEvents(host: HTMLElement, handlers: PageHandlers): void {
  useEffect(() => {
    const { close, refresh, onInput, onMutation, onKeyDown, onFocusIn, onScroll, onPointer, selectedElement } = handlers;
    const owns = (event: Event) => event.composedPath().includes(host);
    let frame = 0;
    const listeners: [EventTarget, string, (event: Event) => void, AddEventListenerOptions?][] = [
      [document, 'mousedown', (event) => !owns(event) && close()],
      // Deferred: let the browser finalize the selection first.
      [document, 'mouseup', (event) => !owns(event) && setTimeout(refresh, 0)],
      // On window, whose capture runs before the page's document-level ones (Radix, most popups), so
      // a key the widget takes never reaches them.
      [window, 'keydown', (event) => onKeyDown(event as KeyboardEvent), { capture: true }],
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
      // Hovering an underline opens its card. Once a frame: mousemove fires far more often than that.
      [
        document,
        'mousemove',
        (event) => {
          if (frame) return;
          const { clientX, clientY } = event as MouseEvent;
          const over = owns(event);
          frame = requestAnimationFrame(() => {
            frame = 0;
            onPointer(clientX, clientY, over);
          });
        },
        { passive: true },
      ],
      // React only when the scroll moves the selected field: pages like Teams scroll unrelated panes
      // (chat list, typing indicators) constantly, which would otherwise kill the menu.
      [
        window,
        'scroll',
        (event) => {
          const { target } = event;
          const field = selectedElement();
          if (field && (target === document || (target instanceof Node && target.contains(field)))) onScroll();
        },
        { capture: true, passive: true },
      ],
      [window, 'resize', () => onScroll()],
    ];
    for (const [target, type, listener, options] of listeners) target.addEventListener(type, listener, options);
    // A page clearing or rewriting a contenteditable from code fires no input event. ponytail: a
    // textarea's .value set from code mutates nothing, so it still goes unseen; poll if that matters.
    let mutated = 0;
    const observer = new MutationObserver((records) => {
      const field = selectedElement();
      if (mutated || !field || !records.some((r) => field.contains(r.target))) return;
      mutated = requestAnimationFrame(() => {
        mutated = 0;
        onMutation();
      });
    });
    observer.observe(document, { childList: true, characterData: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(mutated);
      cancelAnimationFrame(frame);
      for (const [target, type, listener, options] of listeners) target.removeEventListener(type, listener, options);
    };
  }, []);
}
