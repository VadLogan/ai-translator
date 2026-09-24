import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Button, Spinner } from '@heroui/react';
import type { Language } from '../../core/languages';
import type { Anchor } from '../selection';
import { Kbd, PillButton } from '../../ui/buttons';
import { BrandMark, Flag, Icon, type IconName } from '../../ui/icons';

const ICON_SIZE = 26;
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
    <div className={`${dark ? 'dark' : 'light'} font-tm tm-body text-tm-ink`}>
      {view.kind === 'icon' ? <Trigger anchor={anchor} onPress={callbacks.onIconClick} /> : <Panel anchor={anchor} view={view} callbacks={callbacks} />}
    </div>
  );
}

function Trigger({ anchor, onPress }: { anchor: Anchor; onPress: () => void }) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label="Translate selection"
      className="fixed size-[26px] min-w-0 rounded-full p-0 shadow-tm-pop"
      style={iconStyle(anchor)}
      onPress={onPress}
    >
      <BrandMark size={ICON_SIZE} shape="round" />
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
    <div
      ref={ref}
      role="dialog"
      aria-label="Translate selection"
      className="fixed max-h-[420px] min-w-[200px] max-w-[280px] overflow-auto rounded-2xl bg-tm-surface p-1.5 shadow-tm-pop"
    >
      <PanelBody view={view} callbacks={callbacks} />
    </div>
  );
}

function PanelBody({ view, callbacks }: { view: WidgetView; callbacks: WidgetCallbacks }) {
  const settings = <Item label="Settings…" icon="settings" muted onPress={callbacks.onOpenSettings} />;

  switch (view.kind) {
    case 'languages':
      return (
        <>
          <DetectedHeader name={view.detectedName} lang={view.detectedLang} />
          <Section title="Translate to">
            {view.languages.map((language, index) => (
              <Item
                key={language.code}
                label={language.name}
                flag={language.code}
                shortcut={index < 9 ? String(index + 1) : undefined}
                onPress={() => callbacks.onLanguagePick(language.code)}
              />
            ))}
            {view.languages.length === 0 && <Status>No favorite languages yet.</Status>}
          </Section>
          {view.detectedLang !== undefined && (
            <Section title={`Rewrite in ${view.detectedName}`}>
              {/* Not wired up yet: shown to match the design, no service behind it. */}
              <Item label="More native" icon="moreNative" shortcut="N" disabled onPress={noop} />
              <Item label="More official" icon="moreOfficial" shortcut="O" disabled onPress={noop} />
              <Item label="Shorter" icon="shorter" shortcut="S" disabled onPress={noop} />
            </Section>
          )}
          {view.layoutPreview !== undefined && (
            <>
              <Divider />
              <Item label={view.layoutPreview} icon="keyboard" hint="layout" onPress={callbacks.onFixLayout} />
            </>
          )}
          <Divider />
          {settings}
          <div className="flex items-center justify-center gap-1.5 px-2 pb-1 pt-1.5 tm-meta text-tm-muted">
            Press a key · <Kbd>Esc</Kbd> closes
          </div>
        </>
      );

    case 'busy':
      return (
        <Status>
          <Spinner size="sm" className="text-tm-accent" />
          <span>Translating to {view.languageName}…</span>
        </Status>
      );

    case 'signIn':
      return (
        <>
          <div className="flex flex-col gap-1.5 p-1.5">
            <div className="flex items-center gap-2 px-1 pb-1 tm-label text-tm-secondary">
              <Icon name="lock" />
              Sign in to translate
            </div>
            {view.providers.map((provider) => (
              <PillButton key={provider.id} variant="soft" size="sm" fullWidth onPress={() => view.onPick(provider.id)}>
                Sign in with {provider.name}
              </PillButton>
            ))}
          </div>
          <Divider />
          {settings}
        </>
      );

    case 'error':
      return (
        <>
          <div className="px-2.5 py-2 text-tm-danger-ink">{view.message}</div>
          <Divider />
          <Item label="Back" icon="back" onPress={view.onBack} />
          {settings}
        </>
      );

    default:
      return null;
  }
}

function Divider() {
  return <div role="separator" className="mx-1 my-1 h-px bg-tm-line" />;
}

function Status({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 px-2.5 py-2">{children}</div>;
}

/** Flag + "{name} detected" plus a "Change" action -- not wired up yet, so it's rendered disabled. */
function DetectedHeader({ name, lang }: { name?: string; lang?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 pl-2.5 pr-1">
      <span className="flex min-w-0 items-center gap-2">
        {lang !== undefined && <Flag lang={lang} width={18} />}
        <span className="tm-label leading-tight">{name ? `${name} detected` : 'Detecting…'}</span>
      </span>
      <PillButton variant="ghost" size="xs" isDisabled className="gap-1.5 disabled:bg-transparent">
        Change
        <Kbd>C</Kbd>
      </PillButton>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="px-2.5 pb-1 pt-2 tm-group-label text-tm-muted">{title}</div>
      {children}
    </div>
  );
}

/** A menu row: icon or flag, label, then a key hint or a trailing note. */
function Item({
  label,
  hint,
  shortcut,
  icon,
  flag,
  muted,
  disabled,
  onPress,
}: {
  label: string;
  hint?: string;
  shortcut?: string;
  icon?: IconName;
  /** A language code; rows without a flag for it keep the slot so labels stay aligned. */
  flag?: string;
  muted?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      variant="ghost"
      fullWidth
      isDisabled={disabled}
      className={`h-8 min-h-0 justify-between gap-3 rounded-xl px-2.5 tm-label hover:bg-tm-subtle ${muted ? 'text-tm-muted' : 'text-tm-ink'
        }`}
      onPress={onPress}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {(icon !== undefined || flag !== undefined) && (
          <span>
            {icon !== undefined ? <Icon name={icon} /> : <Flag lang={flag!} width={18} />}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      {
        shortcut !== undefined ? (
          <Kbd tone="row">{shortcut}</Kbd>
        ) : (
          hint !== undefined && <span className="tm-meta text-tm-muted">{hint}</span>
        )
      }
    </Button >
  );
}

const noop = () => undefined;

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
