import { Spinner } from '@heroui/react';
import { Kbd, PillButton } from '../../../components/buttons';
import { CountBadge } from '../../../components/CountBadge';
import { Flag } from '../../../components/icons';
import { Divider, Item, Section, Status } from '../../../components/menu';
import type { WidgetView } from '../view';
import { TranslationField } from './TranslationField';

type Props = {
  view: Extract<WidgetView, { kind: 'languages' }>;
  onLanguagePick: (code: string) => void;
  onFixGrammar: () => void;
  onFixLayout: () => void;
  onOpenSettings: () => void;
};

/** The selection's menu: detected language, the targets (digit keys), Grammar fix, the layout fix. */
export function LanguagesPanel({ view, onLanguagePick, onFixGrammar, onFixLayout, onOpenSettings }: Props) {
  const { suggested } = view;
  // The pair's target takes "1"; the list's digits continue after it.
  const first = suggested ? 2 : 1;
  return (
    <>
      <DetectedHeader name={view.detectedName} lang={view.detectedLang} />
      {view.translation && <TranslationField view={view.translation} />}
      {suggested && (
        <Item label={suggested.name} flag={suggested.code} shortcut="1" onPress={() => onLanguagePick(suggested.code)} />
      )}
      <Section title="Translate to">
        {view.languages.map((language, index) => (
          <Item
            key={language.code}
            label={language.name}
            flag={language.code}
            shortcut={index + first <= 9 ? String(index + first) : undefined}
            onPress={() => onLanguagePick(language.code)}
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
            onPress={onFixGrammar}
          />
        </>
      )}
      {!view.readOnly && view.layoutPreview !== undefined && (
        <>
          <Divider />
          <Item label={view.layoutPreview} icon="keyboard" hint="layout" onPress={onFixLayout} />
        </>
      )}
      <Divider />
      <Item label="Settings…" icon="settings" muted onPress={onOpenSettings} />
      <div className="flex items-center justify-center gap-1.5 px-2 pb-1 pt-1.5 tm-meta text-tm-muted">
        Press a key · <Kbd>Esc</Kbd> closes
      </div>
    </>
  );
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
