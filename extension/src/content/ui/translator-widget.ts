import type { Language } from '../../core/languages';
import { WIDGET_CSS } from './styles';

export interface WidgetCallbacks {
  onIconClick(): void;
  onLanguagePick(code: string): void;
  onOpenSettings(): void;
}

export interface Point {
  x: number;
  y: number;
}

const ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`;
const ICON_SIZE = 26;
const GAP = 6;
const VIEWPORT_MARGIN = 8;

/** Floating icon + language menu, isolated from page CSS in a closed shadow root. */
export class TranslatorWidget {
  private readonly host: HTMLElement;
  private readonly icon: HTMLButtonElement;
  private readonly panel: HTMLDivElement;
  private anchor: Point = { x: 0, y: 0 };

  constructor(
    private readonly callbacks: WidgetCallbacks,
    private readonly doc: Document = document,
  ) {
    this.host = doc.createElement('ai-translator-widget');
    this.host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647;';
    const shadow = this.host.attachShadow({ mode: 'closed' });

    const style = doc.createElement('style');
    style.textContent = WIDGET_CSS;

    const root = doc.createElement('div');
    root.className = 'widget';

    this.icon = doc.createElement('button');
    this.icon.className = 'icon';
    this.icon.type = 'button';
    this.icon.title = 'Translate selection';
    this.icon.setAttribute('aria-label', 'Translate selection');
    this.icon.innerHTML = ICON_SVG;
    this.icon.addEventListener('click', () => this.callbacks.onIconClick());

    this.panel = doc.createElement('div');
    this.panel.className = 'panel';
    this.panel.setAttribute('role', 'menu');

    root.append(this.icon, this.panel);
    shadow.append(style, root);

    // Keep focus and the text selection in the page's input while clicking the widget.
    shadow.addEventListener('mousedown', (event) => event.preventDefault());
    // Don't let the page treat clicks on the widget as "outside clicks".
    for (const type of ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup']) {
      this.host.addEventListener(type, (event) => event.stopPropagation());
    }

    this.hide();
  }

  mount(): void {
    if (!this.host.isConnected) this.doc.documentElement.append(this.host);
  }

  destroy(): void {
    this.host.remove();
  }

  get isMenuOpen(): boolean {
    return !this.panel.hidden;
  }

  get isVisible(): boolean {
    return !this.icon.hidden || !this.panel.hidden;
  }

  owns(event: Event): boolean {
    return event.composedPath().includes(this.host);
  }

  showIcon(point: Point): void {
    this.mount();
    this.anchor = point;
    this.panel.hidden = true;
    this.icon.hidden = false;
    const viewport = this.viewport();
    this.icon.style.left = `${clamp(point.x + GAP, VIEWPORT_MARGIN, viewport.width - ICON_SIZE - VIEWPORT_MARGIN)}px`;
    this.icon.style.top = `${clamp(point.y + GAP, VIEWPORT_MARGIN, viewport.height - ICON_SIZE - VIEWPORT_MARGIN)}px`;
  }

  showLanguages(languages: readonly Language[]): void {
    const title = this.element('div', 'title', 'Translate to');
    const items = languages.map((language) => {
      const item = this.element('button', 'item');
      item.type = 'button';
      item.setAttribute('role', 'menuitem');
      item.append(this.element('span', '', language.name), this.element('span', 'code', language.code));
      item.addEventListener('click', () => this.callbacks.onLanguagePick(language.code));
      return item;
    });
    const empty = languages.length === 0 ? [this.element('div', 'status', 'No favorite languages yet.')] : [];
    this.showPanel(title, ...items, ...empty, this.divider(), this.settingsLink());
  }

  showBusy(languageName: string): void {
    const status = this.element('div', 'status');
    status.append(this.element('div', 'spinner'), this.element('span', '', `Translating to ${languageName}…`));
    this.showPanel(status);
  }

  showError(message: string, onBack: () => void): void {
    const back = this.element('button', 'item', '← Back');
    back.type = 'button';
    back.addEventListener('click', onBack);
    this.showPanel(this.element('div', 'error', message), this.divider(), back, this.settingsLink());
  }

  hide(): void {
    this.icon.hidden = true;
    this.panel.hidden = true;
  }

  private showPanel(...children: Node[]): void {
    this.mount();
    this.panel.replaceChildren(...children);
    this.icon.hidden = true;
    this.panel.hidden = false;
    this.positionPanel();
  }

  private positionPanel(): void {
    const viewport = this.viewport();
    const { width, height } = this.panel.getBoundingClientRect();
    let top = this.anchor.y + GAP;
    if (top + height > viewport.height - VIEWPORT_MARGIN) {
      top = this.anchor.y - height - GAP; // flip above the selection
    }
    this.panel.style.left = `${clamp(this.anchor.x + GAP, VIEWPORT_MARGIN, viewport.width - width - VIEWPORT_MARGIN)}px`;
    this.panel.style.top = `${clamp(top, VIEWPORT_MARGIN, viewport.height - height - VIEWPORT_MARGIN)}px`;
  }

  private settingsLink(): HTMLButtonElement {
    const link = this.element('button', 'item link', 'Settings…');
    link.type = 'button';
    link.addEventListener('click', () => this.callbacks.onOpenSettings());
    return link;
  }

  private divider(): HTMLDivElement {
    return this.element('div', 'divider');
  }

  private element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
    const element = this.doc.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  private viewport(): { width: number; height: number } {
    const { clientWidth, clientHeight } = this.doc.documentElement;
    return { width: clientWidth, height: clientHeight };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
