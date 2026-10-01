import { useLayoutEffect, useRef } from 'react';
import type { Anchor } from '../../content/selection';
import { GrammarPanel } from '../../components/GrammarPanel';
import { Recording } from '../../components/Recording';
import { DictationBar } from './panels/DictationBar';
import { LanguagesPanel } from './panels/LanguagesPanel';
import { LayoutPanel } from './panels/LayoutPanel';
import { BusyPanel, ErrorPanel, NotTextPanel, SignInPanel } from './panels/notices';
import { Underlines, type Mark } from './panels/Underlines';
import { panelPosition, viewportSize } from './position';
import { Trigger } from './Trigger';
import type { WidgetCallbacks, WidgetView } from './view';

export interface TranslatorWidgetProps {
  view: WidgetView;
  anchor: Anchor;
  dark: boolean;
  callbacks: WidgetCallbacks;
  /** The field's underlined edits, drawn under whatever else is showing. */
  marks?: readonly Mark[];
}

/** Presentational only: the icon, or a panel positioned against the selection. Translator.tsx decides what. */
export function TranslatorWidget({ view, anchor, dark, callbacks, marks = [] }: TranslatorWidgetProps) {
  if (view.kind === 'hidden') return null;
  return (
    // HeroUI reads its theme from a `.light` / `.dark` ancestor. `:root` matches nothing inside a
    // shadow tree, and the variables have no prefers-color-scheme fallback, so the class is what
    // decides -- both for the CSS variables and for Tailwind's `dark:` variant.
    <div className={`${dark ? 'dark' : 'light'} font-tm tm-body text-tm-ink`}>
      <Underlines marks={marks} />
      {view.kind === 'icon' ? <Trigger anchor={anchor} view={view} onPress={callbacks.onIconClick} onDisable={callbacks.onDisableField} onDictate={callbacks.onDictate} /> : <Panel anchor={anchor} view={view} callbacks={callbacks} />}
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
    // offsetWidth/Height, not getBoundingClientRect: the opening animation scales the panel, and the rect would be the scaled one.
    const size = { width: panel.offsetWidth, height: panel.offsetHeight };
    const { left, top } = panelPosition(anchor, size, viewportSize());
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    // Grow out of the selection: the corner nearest it, whether the panel sits below or flipped above.
    panel.style.transformOrigin = `${anchor.x - left}px ${top >= anchor.bottom ? 0 : size.height}px`;
  });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={view.kind === 'grammar' ? 'Grammar fixed' : view.kind === 'layout' ? 'Wrong keyboard layout' : view.kind === 'notText' ? "Doesn't look like text" : view.kind === 'recording' ? 'Voice input' : 'Translate selection'}
      className={`fixed max-h-[420px] motion-safe:animate-tm-appear overflow-auto rounded-2xl bg-tm-surface p-1.5 shadow-tm-pop ${
        view.kind === 'grammar' || view.kind === 'recording' || (view.kind === 'languages' && view.translation) ? 'w-[340px]' : view.kind === 'layout' || view.kind === 'notText' ? 'w-[279px]' : 'min-w-[200px] max-w-[280px]'
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
    case 'recording':
      return <Recording transcribing={view.transcribing} level={view.level} seconds={view.seconds} text={view.text} onStop={view.onStop} onCancel={view.onCancel} />;
    case 'grammar':
      return (
        <>
          <GrammarPanel view={view} />
          {view.dictation && <DictationBar dictation={view.dictation} />}
        </>
      );
    case 'layout':
      return <LayoutPanel view={view} onFixLayout={callbacks.onFixLayout} />;
    case 'notText':
      return <NotTextPanel />;
    case 'signIn':
      return <SignInPanel view={view} onOpenSettings={callbacks.onOpenSettings} />;
    case 'error':
      return <ErrorPanel view={view} onOpenSettings={callbacks.onOpenSettings} />;
    default:
      return null;
  }
}
