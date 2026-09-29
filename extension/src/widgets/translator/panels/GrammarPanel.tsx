import type { ReactNode } from 'react';
import { Skeleton, Spinner } from '@heroui/react';
import { Kbd, PillButton } from '../../../components/buttons';
import { Icon } from '../../../components/icons';
import { Divider, Item, Section } from '../../../components/menu';
import { Text } from '../../../components/typography';
import type { WidgetView } from '../view';

/** The grammar fix: a skeleton while it loads, the highlighted fix with Replace / Copy, then the rewrites. */
export function GrammarPanel({ view }: { view: Extract<WidgetView, { kind: 'grammarFixed' }> }) {
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
