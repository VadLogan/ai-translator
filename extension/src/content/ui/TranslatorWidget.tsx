import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Button, Card, Separator, Spinner } from '@heroui/react';
import type { Language } from '../../core/languages';
import type { Anchor } from '../selection';
import ICON_SVG from '../../assets/translate-icon.svg?raw';

export const ICON_SIZE = 26;
const GAP = 6;
const VIEWPORT_MARGIN = 8;

export interface WidgetCallbacks {
  onIconClick(): void;
  onLanguagePick(code: string): void;
  onFixLayout(): void;
  onOpenSettings(): void;
}

/**
 * Everything the widget can be showing. The imperative facade in translator-widget.ts turns each
 * of its show*() calls into one of these, so the content script keeps its old API.
 */
export type WidgetView =
  | { kind: 'hidden' }
  | { kind: 'icon' }
  | {
      kind: 'languages';
      languages: readonly Language[];
      /** The selection re-typed on the other keyboard layout, offered as a menu item. */
      layoutPreview?: string;
      /** Left out while POST /detect is still in flight, detection failed, or the text was mistyped. */
      detectedName?: string;
      /** The detected language code, e.g. "en" -- present only alongside a real detectedName, so the
       *  Rewrite section (which needs an actual source language) doesn't show for "unknown" or
       *  "wrong keyboard layout". */
      detectedLang?: string;
    }
  | { kind: 'busy'; languageName: string }
  | { kind: 'signIn'; providers: readonly { id: string; name: string }[]; onPick: (id: string) => void }
  | { kind: 'error'; message: string; onBack: () => void };

export interface TranslatorWidgetProps {
  view: WidgetView;
  anchor: Anchor;
  dark: boolean;
  callbacks: WidgetCallbacks;
}

export function TranslatorWidget({ view, anchor, dark, callbacks }: TranslatorWidgetProps) {
  if (view.kind === 'hidden') return null;
  return (
    // HeroUI reads its theme from a `.light` / `.dark` ancestor. `:root` matches nothing inside a
    // shadow tree, and the variables have no prefers-color-scheme fallback, so the class is what
    // decides -- both for the CSS variables and for Tailwind's `dark:` variant.
    <div className={`${dark ? 'dark' : 'light'} font-sans text-[13px] leading-[1.4] text-foreground`}>
      {view.kind === 'icon' ? <Icon anchor={anchor} onPress={callbacks.onIconClick} /> : <Panel anchor={anchor} view={view} callbacks={callbacks} />}
    </div>
  );
}

function Icon({ anchor, onPress }: { anchor: Anchor; onPress: () => void }) {
  return (
    <Button
      isIconOnly
      variant="outline"
      aria-label="Translate selection"
      className="fixed size-[26px] min-w-0 rounded-[7px] border border-border bg-surface p-0 shadow-overlay [&>span>svg]:size-4"
      style={iconStyle(anchor)}
      onPress={onPress}
    >
      {/* Our own asset, imported as raw markup -- the same thing the old widget assigned to innerHTML. */}
      {/* `title` rides on the span because react-aria's Button type does not accept it. */}
      <span title="Translate selection" className="grid place-items-center" dangerouslySetInnerHTML={{ __html: ICON_SVG }} />
    </Button>
  );
}

function Panel({ anchor, view, callbacks }: { anchor: Anchor; view: WidgetView; callbacks: WidgetCallbacks }) {
  const ref = useRef<HTMLDivElement>(null);

  // Measure after every render: the panel's height decides whether it sits below the selection or
  // flips above it, and each state (menu, spinner, error) is a different height.
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    const { width, height } = panel.getBoundingClientRect();
    let top = anchor.bottom + GAP;
    if (top + height > viewport.height - VIEWPORT_MARGIN) top = anchor.top - height - GAP;
    panel.style.left = `${clamp(anchor.x + GAP, VIEWPORT_MARGIN, viewport.width - width - VIEWPORT_MARGIN)}px`;
    panel.style.top = `${clamp(top, VIEWPORT_MARGIN, viewport.height - height - VIEWPORT_MARGIN)}px`;
  });

  return (
    <Card
      ref={ref}
      aria-label="Translate selection"
      className="fixed max-h-[320px] min-w-[180px] max-w-[260px] overflow-auto rounded-lg border border-border bg-surface p-1 shadow-overlay"
    >
      <PanelBody view={view} callbacks={callbacks} />
    </Card>
  );
}

function PanelBody({ view, callbacks }: { view: WidgetView; callbacks: WidgetCallbacks }) {
  const settings = <Item label="Settings…" muted onPress={callbacks.onOpenSettings} />;

  switch (view.kind) {
    case 'languages':
      return (
        <>
          <DetectedHeader name={view.detectedName} />
          <Section title="Translate to">
            {view.languages.map((language, index) => (
              <Item
                key={language.code}
                label={language.name}
                shortcut={index < 9 ? String(index + 1) : undefined}
                onPress={() => callbacks.onLanguagePick(language.code)}
              />
            ))}
            {view.languages.length === 0 && <Status>No favorite languages yet.</Status>}
          </Section>
          {view.detectedLang !== undefined && (
            <Section title={`Rewrite in ${view.detectedName}`}>
              {/* Not wired up yet: shown to match the design, no service behind it. */}
              <Item label="More native" icon={SPARKLE_ICON} shortcut="N" disabled onPress={noop} />
              <Item label="More official" icon={DOCUMENT_ICON} shortcut="O" disabled onPress={noop} />
              <Item label="Shorter" icon={LINES_ICON} shortcut="S" disabled onPress={noop} />
            </Section>
          )}
          {view.layoutPreview !== undefined && (
            <>
              <Separator className="my-1" />
              <Item label={view.layoutPreview} hint="layout" onPress={callbacks.onFixLayout} />
            </>
          )}
          <Separator className="my-1" />
          {settings}
          <div className="px-2 pb-1 pt-1 text-center text-[11px] text-muted">Press a key · Esc closes</div>
        </>
      );

    case 'busy':
      return (
        <Status>
          <Spinner size="sm" />
          <span>Translating to {view.languageName}…</span>
        </Status>
      );

    case 'signIn':
      return (
        <>
          <Status>Sign in to translate</Status>
          <Separator className="my-1" />
          {view.providers.map((provider) => (
            <Item key={provider.id} label={`Sign in with ${provider.name}`} onPress={() => view.onPick(provider.id)} />
          ))}
          <Separator className="my-1" />
          {settings}
        </>
      );

    case 'error':
      return (
        <>
          <div className="p-2 text-danger">{view.message}</div>
          <Separator className="my-1" />
          <Item label="← Back" onPress={view.onBack} />
          {settings}
        </>
      );

    default:
      return null;
  }
}

function Status({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 p-2">{children}</div>;
}

/** "{name} detected" plus a "Change" action -- not wired up yet, so it's rendered disabled. */
function DetectedHeader({ name }: { name?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-1.5">
      <span className="truncate text-[13px]">{name ? `${name} detected` : 'detecting…'}</span>
      <Button
        variant="ghost"
        size="sm"
        isDisabled
        className="h-6 min-h-0 gap-1.5 px-1.5 text-xs font-normal text-muted"
      >
        Change
        <ShortcutBadge shortcut="C" />
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</div>
      {children}
    </div>
  );
}

function ShortcutBadge({ shortcut }: { shortcut: string }) {
  return (
    <span className="grid size-4.5 shrink-0 place-items-center rounded bg-foreground/10 text-[11px] font-medium text-muted">
      {shortcut}
    </span>
  );
}

function Item({
  label,
  hint,
  shortcut,
  icon,
  muted,
  disabled,
  onPress,
}: {
  label: string;
  hint?: string;
  shortcut?: string;
  icon?: string;
  muted?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      fullWidth
      isDisabled={disabled}
      className={`h-7 min-h-0 justify-between gap-3 px-2 text-[13px] font-normal ${muted ? 'text-muted' : ''}`}
      onPress={onPress}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon !== undefined && <span className="grid size-4 shrink-0 place-items-center" dangerouslySetInnerHTML={{ __html: icon }} />}
        <span className="truncate">{label}</span>
      </span>
      {shortcut !== undefined ? (
        <ShortcutBadge shortcut={shortcut} />
      ) : (
        hint !== undefined && <span className="text-xs text-muted">{hint}</span>
      )}
    </Button>
  );
}

const noop = () => undefined;

/** Inline so the redesigned rewrite section needs no icon dependency -- same pattern as ICON_SVG. */
const SPARKLE_ICON =
  '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.2 4.3L13 6.5l-3.8 1.2L8 12l-1.2-4.3L3 6.5l3.8-1.2L8 1z"/></svg>';
const DOCUMENT_ICON =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 1.5h5.5L12 4v10.5H4V1.5z"/><path d="M9 1.5V4h3"/></svg>';
const LINES_ICON =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M2.5 4.5h11M2.5 8h8M2.5 11.5h5"/></svg>';

function iconStyle(anchor: Anchor): CSSProperties {
  const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
  let top = anchor.top - ICON_SIZE - GAP;
  if (top < VIEWPORT_MARGIN) top = anchor.bottom + GAP; // no room above: drop below the selection
  return {
    left: clamp(anchor.x - ICON_SIZE / 2, VIEWPORT_MARGIN, viewport.width - ICON_SIZE - VIEWPORT_MARGIN),
    top: clamp(top, VIEWPORT_MARGIN, viewport.height - ICON_SIZE - VIEWPORT_MARGIN),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
