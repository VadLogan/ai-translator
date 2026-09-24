import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Button, Skeleton, Spinner } from '@heroui/react';
import type { RewriteStyle } from '../../../../shared/contract';
import { findLanguage, type Language } from '../../core/languages';
import type { Anchor } from '../selection';
import { IconButton, Kbd, PillButton } from '../../ui/buttons';
import { BrandMark, Flag, Icon, type IconName } from '../../ui/icons';
import { Text } from '../../ui/typography';

const ICON_SIZE = 26;
const GAP = 6;
const VIEWPORT_MARGIN = 8;

export interface WidgetCallbacks {
  onIconClick(): void;
  onLanguagePick(code: string): void;
  onFixLayout(): void;
  onFixGrammar(): void;
  onOpenSettings(): void;
}

/** Everything the widget can be showing. Translator.tsx derives it from the flow's state. */
export type WidgetView =
  | { kind: 'hidden' }
  /** `field`: sits in the focused field's bottom-right corner instead of above the selection. */
  /** `badge`: errors the background grammar check found; 0 = clean, 'error' = the check failed, absent = not checked. */
  /** 'layout' = typed on the wrong keyboard layout, 'gibberish' = random keystrokes; both on either icon. */
  | { kind: 'icon'; field?: boolean; badge?: Badge; checking?: boolean }
  | {
    kind: 'languages';
    languages: readonly Language[];
    /** The selection re-typed on the other keyboard layout, offered as a menu item. */
    layoutPreview?: string;
    /** Left out while POST /detect is still in flight, detection failed, or the text was mistyped. */
    detectedName?: string;
    /** The detected language code, e.g. "en" -- present only alongside a real detectedName. */
    detectedLang?: string;
    /** The selection's grammar check: its error count, or still running. 'error' and 'layout' hide the item. */
    grammar?: number | 'error' | 'checking' | 'layout' | 'gibberish';
    /** Page text, not a field: nothing can be replaced, so only the languages are offered. */
    readOnly?: boolean;
  }
  | { kind: 'busy'; label: string }
  | {
    kind: 'grammarFixed';
    /** `FixGrammarOk.html`: escaped text with each edit wrapped in `<span class="fix" data-original>`.
     *  Absent while the check is still running: a skeleton, with nothing to press. */
    html?: string;
    /** The text's language code, for the preview's `lang`. */
    lang?: string;
    onReplace: () => void;
    onCopy: () => void;
    onRewrite: (style: RewriteStyle) => void;
  }
  /**
   * Wrong keyboard layout: `typed` as it is, `fixed` re-typed on the other layout. `from` is what it
   * reads as, `to` the language of the fix. The card's button is `callbacks.onFixLayout`.
   */
  | { kind: 'layout'; typed: string; fixed: string; from: string; to: string; onDismiss: () => void }
  /** Random keystrokes: a notice. `onContinue` waves it off and opens the regular widget. */
  | { kind: 'notText'; onContinue: () => void }
  /** A page selection's translation, to copy. `lang` is the target language code. */
  | { kind: 'translated'; text: string; lang: string; onCopy: () => void }
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
      {view.kind === 'icon' ? <Trigger anchor={anchor} field={view.field} badge={view.badge} checking={view.checking} onPress={callbacks.onIconClick} /> : <Panel anchor={anchor} view={view} callbacks={callbacks} />}
    </div>
  );
}

function Trigger({
  anchor,
  field,
  badge,
  checking,
  onPress,
}: {
  anchor: Anchor;
  field?: boolean;
  badge?: Badge;
  checking?: boolean;
  onPress: () => void;
}) {
  const label = badge === 'layout'
    ? 'Wrong keyboard layout'
    : badge === 'gibberish'
    ? "Doesn't look like text"
    : !field
    ? 'Translate selection'
    : checking
      ? 'Checking grammar…'
      : badge === undefined
        ? 'Fix grammar'
        : badge === 'error'
          ? 'Grammar check failed'
          : `Fix grammar: ${badge === 1 ? '1 error' : `${badge} errors`}`;
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={label}
      className="fixed size-[26px] min-w-0 overflow-visible rounded-full p-0 shadow-tm-pop"
      style={field ? cornerStyle(anchor) : iconStyle(anchor)}
      onPress={onPress}
    >
      <BrandMark size={ICON_SIZE} shape="round" />
      {checking && (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center rounded-full bg-tm-surface/70">
          <Spinner size="sm" className="text-tm-accent" />
        </span>
      )}
      {badge !== undefined && <CountBadge count={badge} className="absolute -right-1.5 -top-1.5 ring-2 ring-tm-surface" />}
    </Button>
  );
}

/**
 * The check's result as a pill: the error count, a check when clean, a warning "!" for a wrong
 * keyboard layout, a warning "?" for random keystrokes, a red "!" when the check failed.
 */
function CountBadge({ count, className = '' }: { count: Badge; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none ${className} ${
        count === 'error' ? 'bg-tm-danger-ink text-tm-on-accent' : count === 'layout' || count === 'gibberish' || count > 0 ? 'bg-tm-warning text-tm-ink' : 'bg-tm-success text-tm-ink'
      }`}
    >
      {count === 'error' || count === 'layout' ? '!' : count === 'gibberish' ? '?' : count > 0 ? (count > 9 ? '9+' : count) : <Icon name="check" size={9} strokeWidth={3.4} />}
    </span>
  );
}

type Badge = number | 'error' | 'layout' | 'gibberish';

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
      aria-label={view.kind === 'grammarFixed' ? 'Grammar fixed' : view.kind === 'layout' ? 'Wrong keyboard layout' : view.kind === 'notText' ? "Doesn't look like text" : 'Translate selection'}
      className={`fixed max-h-[420px] overflow-auto rounded-2xl bg-tm-surface p-1.5 shadow-tm-pop ${view.kind === 'grammarFixed' || view.kind === 'translated' ? 'w-[340px]' : view.kind === 'layout' || view.kind === 'notText' ? 'w-[279px]' : 'min-w-[200px] max-w-[280px]'
        }`}
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
          {!view.readOnly && view.grammar !== 'error' && view.grammar !== 'layout' && view.grammar !== 'gibberish' && (
            <>
              <Divider />
              <Item
                label="Grammar fix"
                icon="fixGrammar"
                hint={view.grammar === 'checking' ? <Spinner size="sm" className="text-tm-accent" /> : view.grammar === undefined ? undefined : <CountBadge count={view.grammar} />}
                onPress={callbacks.onFixGrammar}
              />
            </>
          )}
          {!view.readOnly && view.layoutPreview !== undefined && (
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
          <span dir="auto">{view.label}</span>
        </Status>
      );

    case 'grammarFixed': {
      const loading = view.html === undefined;
      const { nodes, changes } = loading ? { nodes: [], changes: 0 } : fixedText(view.html!);
      // Nothing to fix: echoing the text and offering to "replace" it with itself helps no one.
      const clean = !loading && changes === 0;
      return (
        <>
          <div className="flex h-10 items-center gap-2 pl-2.5 pr-1">
            {loading ? (
              <Spinner size="sm" className="text-tm-accent" />
            ) : (
              <span className="flex size-5 items-center justify-center rounded-full bg-tm-success text-tm-ink">
                <Icon name="check" size={11} strokeWidth={3.4} />
              </span>
            )}
            <Text variant="label" className="grow">{loading ? 'Checking grammar…' : changes ? 'Grammar fixed' : 'Nothing to fix'}</Text>
            {changes > 0 && <Text variant="meta" className="pr-1.5">{changes === 1 ? '1 change' : `${changes} changes`}</Text>}
          </div>
          {loading ? (
            <div aria-busy className="mx-1 flex flex-col gap-2 rounded-2xl bg-tm-subtle px-3 py-3.5">
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-4/5 rounded-full" />
              <Skeleton className="h-3 w-3/5 rounded-full" />
            </div>
          ) : clean ? (
            <Text variant="meta" className="block px-2.5 pb-1">
              No grammar issues. Want it to sound more native or more official? Try a rewrite below.
            </Text>
          ) : (
            <p lang={view.lang} className="mx-1 my-0 rounded-2xl bg-tm-subtle px-3 py-2.5 tm-body leading-relaxed">
              {nodes}
            </p>
          )}
          {!clean && (
            <div className="flex gap-1.5 px-1 pb-1 pt-2">
              <PillButton variant="primary" size="md" className="grow" isDisabled={loading} onPress={view.onReplace}>
                Replace <Kbd tone="onAccent">↵</Kbd>
              </PillButton>
              <PillButton size="md" isDisabled={loading} onPress={view.onCopy}>Copy</PillButton>
            </div>
          )}
          <Divider />
          <Section title={clean ? 'Rewrite' : 'Rewrite further'}>
            <Item label="More native" icon="moreNative" shortcut="N" disabled={loading} onPress={() => view.onRewrite('natural')} />
            <Item label="More official" icon="moreOfficial" shortcut="O" disabled={loading} onPress={() => view.onRewrite('formal')} />
          </Section>
        </>
      );
    }

    case 'layout':
      return (
        <>
          <div className="m-0.5 flex flex-col gap-2.5 rounded-[18px] bg-tm-soft p-3 text-tm-accent-text">
            <div className="flex items-center gap-2">
              <Icon name="keyboard" size={15} strokeWidth={1.9} />
              <Text variant="label" tone="accent" className="grow">Wrong keyboard layout</Text>
              <IconButton aria-label="Dismiss the layout suggestion" tone="accent" size={24} onPress={view.onDismiss}>
                <Icon name="close" size={12} strokeWidth={2.6} />
              </IconButton>
            </div>
            <div className="flex flex-col gap-0.5">
              <span lang={view.from} className="text-[12px] line-through">{view.typed}</span>
              <span lang={view.to} className="text-[15px] font-semibold text-tm-ink">{view.fixed}</span>
            </div>
            <PillButton variant="primary" size="sm" fullWidth onPress={callbacks.onFixLayout}>
              Fix the characters <Kbd tone="onAccent">F</Kbd>
            </PillButton>
          </div>
          <div className="flex h-10 items-center gap-2 pl-2.5 pr-1">
            <Icon name="script" size={14} strokeWidth={1.9} className="text-tm-placeholder" />
            <Text variant="label" tone="muted" className="grow font-normal">Reads as {findLanguage(view.from)?.name ?? view.from}</Text>
            {/* Not wired up yet, like the menu's Change. */}
            <PillButton variant="ghost" size="xs" isDisabled aria-label="Change the detected language" className="gap-1.5 disabled:bg-transparent">
              Change
              <Kbd>C</Kbd>
            </PillButton>
          </div>
        </>
      );

    case 'notText':
      return (
        <>
          <div className="m-0.5 flex items-start gap-2 rounded-[18px] bg-tm-warning-soft p-3 text-tm-warning-ink">
            <Icon name="question" size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <Text variant="label" className="text-tm-warning-ink">Doesn't look like text</Text>
              <span className="tm-meta">It isn't a language on either keyboard layout, so there is nothing to fix.</span>
            </div>
          </div>
          <Item label="Check anyway" icon="forward" onPress={view.onContinue} />
        </>
      );

    case 'translated':
      return (
        <>
          <div className="flex h-10 items-center gap-2 pl-2.5 pr-1">
            <Flag lang={view.lang} width={18} />
            <Text variant="label" className="grow">{findLanguage(view.lang)?.name ?? view.lang}</Text>
          </div>
          <p lang={view.lang} dir="auto" className="mx-1 my-0 rounded-2xl bg-tm-subtle px-3 py-2.5 tm-body leading-relaxed">
            {view.text}
          </p>
          <div className="flex px-1 pb-1 pt-2">
            <PillButton variant="primary" size="md" className="grow" onPress={view.onCopy}>Copy</PillButton>
          </div>
          <div className="flex items-center justify-center gap-1.5 px-2 pb-1 pt-1.5 tm-meta text-tm-muted">
            <Kbd>Esc</Kbd> closes
          </div>
        </>
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
  hint?: ReactNode;
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

/**
 * `FixGrammarOk.html` as React nodes: text stays text, each `span.fix` becomes a highlight titled
 * with what it replaced. Parsed rather than injected, so nothing but text reaches the page.
 */
function fixedText(html: string): { nodes: ReactNode[]; changes: number } {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  let changes = 0;
  const nodes = [...body.childNodes].map((node, index) => {
    if (!(node instanceof Element) || !node.classList.contains('fix')) return node.textContent;
    changes++;
    const original = node.getAttribute('data-original') ?? '';
    return (
      <span key={index} title={original ? `was: ${original}` : 'added'} className="rounded bg-tm-soft px-0.5 text-tm-accent-text">
        {node.textContent}
      </span>
    );
  });
  return { nodes, changes };
}


function iconStyle(anchor: Anchor): CSSProperties {
  const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
  let top = anchor.top - ICON_SIZE - GAP;
  if (top < VIEWPORT_MARGIN) top = anchor.bottom + GAP; // no room above: drop below the selection
  return {
    left: clamp(anchor.x - ICON_SIZE / 2, VIEWPORT_MARGIN, viewport.width - ICON_SIZE - VIEWPORT_MARGIN),
    top: clamp(top, VIEWPORT_MARGIN, viewport.height - ICON_SIZE - VIEWPORT_MARGIN),
  };
}

/** Inside the field's bottom-right corner, clear of its border. */
function cornerStyle(anchor: Anchor): CSSProperties {
  return { left: anchor.x - ICON_SIZE - GAP, top: anchor.bottom - ICON_SIZE - GAP };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
