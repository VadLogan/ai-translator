import { useLayoutEffect, useRef } from 'react';
import type { Anchor } from '../../content/selection';
import { GrammarPanel } from './panels/GrammarPanel';
import { LanguagesPanel } from './panels/LanguagesPanel';
import { LayoutPanel } from './panels/LayoutPanel';
import { BusyPanel, ErrorPanel, NotTextPanel, SignInPanel } from './panels/notices';
import { TranslatedPanel } from './panels/TranslatedPanel';
import { panelPosition, viewportSize } from './position';
import { Trigger } from './Trigger';
import type { WidgetCallbacks, WidgetView } from './view';

export interface TranslatorWidgetProps {
  view: WidgetView;
  anchor: Anchor;
  dark: boolean;
  callbacks: WidgetCallbacks;
}

/** Presentational only: the icon, or a panel positioned against the selection. Translator.tsx decides what. */
export function TranslatorWidget({ view, anchor, dark, callbacks }: TranslatorWidgetProps) {
  if (view.kind === 'hidden') return null;
  return (
    // HeroUI reads its theme from a `.light` / `.dark` ancestor. `:root` matches nothing inside a
    // shadow tree, and the variables have no prefers-color-scheme fallback, so the class is what
    // decides -- both for the CSS variables and for Tailwind's `dark:` variant.
    <div className={`${dark ? 'dark' : 'light'} font-tm tm-body text-tm-ink`}>
      {view.kind === 'icon' ? <Trigger anchor={anchor} view={view} onPress={callbacks.onIconClick} onDisable={callbacks.onDisableField} /> : <Panel anchor={anchor} view={view} callbacks={callbacks} />}
    </div>
  );
}

function Panel({ anchor, view, callbacks }: { anchor: Anchor; view: WidgetView; callbacks: WidgetCallbacks }) {
  const ref = useRef<HTMLDivElement>(null);

  // Measure after every render: the panel's height decides whether it sits below the selection or
  // flips above it, and each state (menu, spinner, error) is a different height.
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const { left, top } = panelPosition(anchor, panel.getBoundingClientRect(), viewportSize());
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={view.kind === 'grammarFixed' ? 'Grammar fixed' : view.kind === 'layout' ? 'Wrong keyboard layout' : view.kind === 'notText' ? "Doesn't look like text" : 'Translate selection'}
      className={`fixed max-h-[420px] overflow-auto rounded-2xl bg-tm-surface p-1.5 shadow-tm-pop ${
        view.kind === 'grammarFixed' || view.kind === 'translated' ? 'w-[340px]' : view.kind === 'layout' || view.kind === 'notText' ? 'w-[279px]' : 'min-w-[200px] max-w-[280px]'
      }`}
    >
      <PanelBody view={view} callbacks={callbacks} />
    </div>
  );
}

function PanelBody({ view, callbacks }: { view: WidgetView; callbacks: WidgetCallbacks }) {
  switch (view.kind) {
    case 'languages':
      return <LanguagesPanel view={view} {...callbacks} />;
    case 'busy':
      return <BusyPanel view={view} />;
    case 'grammarFixed':
      return <GrammarPanel view={view} />;
    case 'layout':
      return <LayoutPanel view={view} onFixLayout={callbacks.onFixLayout} />;
    case 'notText':
      return <NotTextPanel />;
    case 'translated':
      return <TranslatedPanel view={view} />;
    case 'signIn':
      return <SignInPanel view={view} onOpenSettings={callbacks.onOpenSettings} />;
    case 'error':
      return <ErrorPanel view={view} onOpenSettings={callbacks.onOpenSettings} />;
    default:
      return null;
  }
}
