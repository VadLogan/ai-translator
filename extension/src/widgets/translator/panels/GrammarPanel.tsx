import type { ReactNode } from 'react';
import { Skeleton, Spinner } from '@heroui/react';
import { IconButton, Kbd, PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { Divider } from '../../../components/menu';
import { Text } from '../../../components/typography';
import type { WidgetView } from '../view';

/**
 * The grammar fix, one edit at a time: the fixed text with the shown edit picked out, then that
 * edit (kind, `original → replacement`, why) with Replace / Ignore / Replace all and ‹ › between them.
 */
export function GrammarPanel({ view }: { view: Extract<WidgetView, { kind: 'grammar' }> }) {
  const loading = view.html === undefined;
  const count = view.edits.length;
  const edit = view.edits[view.index];
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
        <Text variant="label" className="grow">{loading ? 'Checking grammar…' : count ? 'Grammar fixed' : 'Nothing to fix'}</Text>
        {count > 0 && <Text variant="meta" className="pr-1.5">{count === 1 ? '1 change' : `${count} changes`}</Text>}
      </div>
      {loading ? (
        <div aria-busy className="mx-1 flex flex-col gap-2 rounded-2xl bg-tm-subtle px-3 py-3.5">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
          <Skeleton className="h-3 w-3/5 rounded-full" />
        </div>
      ) : count > 0 && (
        <p lang={view.lang} className="mx-1 my-0 rounded-2xl bg-tm-subtle px-3 py-2.5 tm-body leading-relaxed">
          {fixedText(view.html!, view.index, view.ignored, view.onStep)}
        </p>
      )}
      {edit && (
        <>
          <div className="pt-1.5"><Divider /></div>
          <div className="flex flex-col gap-2 px-2 pb-1 pt-2">
            <div className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${edit.kind === 'native' ? 'bg-tm-accent' : 'bg-tm-danger-ink'}`} />
              <span className={`grow tm-label ${edit.kind === 'native' ? 'text-tm-accent-text' : 'text-tm-danger-ink'}`}>
                {edit.kind === 'native' ? 'Sounds more native' : 'Grammar'}
              </span>
              {count > 1 && (
                <>
                  <Text variant="meta" className="pr-1">{view.index + 1} of {count}</Text>
                  <IconButton aria-label="Previous" size={28} isDisabled={view.index === 0} onPress={() => view.onStep(view.index - 1)}>
                    <Icon name="back" size={14} />
                  </IconButton>
                  <IconButton aria-label="Next" size={28} isDisabled={view.index === count - 1} onPress={() => view.onStep(view.index + 1)}>
                    <Icon name="forward" size={14} />
                  </IconButton>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 tm-body">
              {edit.original.trim() && <span className="text-tm-muted line-through">{edit.original}</span>}
              <Icon name="forward" size={12} strokeWidth={2.2} className="text-tm-placeholder" />
              <span className="font-semibold">{edit.replacement.trim() || '(remove)'}</span>
            </div>
            {edit.reason && <Text variant="helper">{edit.reason}</Text>}
            <div className="flex gap-1.5 pt-1">
              <PillButton variant="primary" size="md" onPress={view.onReplace}>
                Replace <Kbd tone="onAccent">↵</Kbd>
              </PillButton>
              <PillButton size="md" onPress={view.onIgnore}>Ignore</PillButton>
              {count > 1 && <PillButton size="md" onPress={view.onReplaceAll}>Replace all · {count}</PillButton>}
            </div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * `FixGrammarOk.html` as React nodes: text stays text, each `span.fix` a highlight -- the shown edit
 * strong, the others soft, an ignored one back to its original text. Clicking a highlight shows that
 * edit. Parsed rather than injected, so nothing but text reaches the page.
 */
function fixedText(html: string, index: number, ignored: readonly number[], onStep: (index: number) => void): ReactNode[] {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  let span = -1;
  let shown = -1;
  return [...body.childNodes].map((node, key) => {
    if (!(node instanceof Element) || !node.classList.contains('fix')) return node.textContent;
    span++;
    if (ignored.includes(span)) return node.getAttribute('data-original') ?? '';
    const at = ++shown;
    return (
      <span
        key={key}
        onClick={() => onStep(at)}
        className={`cursor-pointer rounded px-0.5 ${at === index ? 'bg-tm-accent/25 font-semibold text-tm-ink' : 'bg-tm-soft text-tm-accent-text'}`}
      >
        {node.textContent}
      </span>
    );
  });
}
