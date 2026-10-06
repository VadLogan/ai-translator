import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { GrammarPanel, type GrammarView } from '../components/GrammarPanel';
import { Recording } from '../components/Recording';
import { findLanguage } from '../core/languages';
import settingsMeta from '../popups/settings/SettingsPage.stories';
import { SettingsPage } from '../popups/settings/SettingsPage';
import { HISTORY, noop } from '../popups/toolbar/fixtures';
import { PopupFrame } from '../popups/toolbar/Popup';
import historyMeta from '../popups/toolbar/screens/History.stories';
import { History } from '../popups/toolbar/screens/History';
import homeMeta from '../popups/toolbar/screens/Home.stories';
import { Home } from '../popups/toolbar/screens/Home';
import { TranslatorWidget } from '../widgets/translator/TranslatorWidget';
import type { WidgetCallbacks, WidgetView } from '../widgets/translator/view';

const meta = { title: 'Demo/Session 1 — 2026-10-01 13:36', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const H6 = 'mb-2 text-xs font-bold uppercase tracking-wide text-tm-accent';

const CALLBACKS: WidgetCallbacks = { onIconClick: noop, onLanguagePick: noop, onFixLayout: noop, onFixGrammar: noop, onAddException: noop, onOpenSettings: noop, onDisableField: noop, onDictate: noop };
const FAVORITES = ['en', 'de', 'uk'].map((code) => findLanguage(code)!);
const LIVE = 'Hi team, I have sent the report yesterday and they were happy with it. Next week we will review the budget, the timeline and the open questions from the client. Please send me your comments before Friday so I can update the plan.';
const fix = (text: string, original: string) => `<span class="fix" data-original="${original}">${text}</span>`;
const GRAMMAR: GrammarView = {
  lang: 'en',
  html: `I ${fix('sent', 'has send')} the report yesterday and they ${fix('were', 'was')} happy with it.`,
  edits: [
    { kind: 'error', original: 'has send', replacement: 'sent', reason: '"Yesterday" takes the past simple.' },
    { kind: 'error', original: 'was', replacement: 'were', reason: '"They" takes "were".' },
  ],
  index: 0,
  ignored: [],
  onReplace: noop,
  onIgnore: noop,
  onReplaceAll: noop,
  onStep: noop,
};
const DICTATION = { transcript: 'I has send the report yesterday and they was happy with it.', onInsert: noop, onCopy: noop };

/** The in-page widget is `position: fixed`; the transform makes this box its containing block, so several stack on one page. */
function Widget({ view, height = 220, dark }: { view: WidgetView; height?: number; dark: boolean }) {
  // A field's corner icon sits at the anchor's bottom-right; a panel opens below the anchor, from its x.
  const anchor = view.kind === 'icon' ? { x: 360, top: 20, bottom: 56 } : { x: 4, top: 0, bottom: 0 };
  return (
    <div className="relative w-[360px]" style={{ height, transform: 'translateZ(0)' }}>
      <TranslatorWidget view={view} anchor={anchor} dark={dark} callbacks={CALLBACKS} />
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h6 className={H6}>{title}</h6>
      {children}
    </section>
  );
}

const isDark = (globals: Record<string, unknown>) => globals['theme'] === 'dark';

// -- one block per change ------------------------------------------------------------------------

const MicInPill = ({ dark }: { dark: boolean }) => (
  <Block title="Trigger.tsx — mic (Voice input) in the field icon's hover pill">
    <Widget dark={dark} height={70} view={{ kind: 'icon', field: true, canDisable: true, hovered: true, badge: 0 }} />
  </Block>
);

const RecordingStates = () => (
  <Block title="Recording.tsx (new, components/) — level bars, m:ss timer, live text that keeps growing; then Transcribing…">
    <div className="flex w-[340px] flex-col gap-3">
      {[
        { label: 'listening, live text (all rows, scrolls past ~8)', props: { transcribing: false, level: 0.7, seconds: 14, text: LIVE } },
        { label: 'listening, silent (flat bars — stops itself after 3 s)', props: { transcribing: false, level: 0, seconds: 2 } },
        { label: 'transcribing', props: { transcribing: true } },
      ].map(({ label, props }) => (
        <div key={label}>
          <p className="mb-1 text-[11px] text-tm-muted">{label}</p>
          <div className="rounded-2xl bg-tm-surface p-1.5 shadow-tm-pop">
            <Recording {...props} onStop={noop} onCancel={noop} />
          </div>
        </div>
      ))}
    </div>
  </Block>
);

const WidgetRecording = ({ dark }: { dark: boolean }) => (
  <Block title="TranslatorWidget.tsx — recording panel, now 340 px wide like grammar/translation">
    <Widget dark={dark} height={260} view={{ kind: 'recording', transcribing: false, level: 0.6, seconds: 9, text: LIVE, onStop: noop, onCancel: noop }} />
  </Block>
);

const WidgetDictationGrammar = ({ dark }: { dark: boolean }) => (
  <Block title="DictationBar.tsx (new) — English dictation: grammar panel on the transcript, Transcribed (collapsed), Copy / Insert">
    <Widget dark={dark} height={420} view={{ kind: 'grammar', ...GRAMMAR, dictation: { ...DICTATION, text: DICTATION.transcript } }} />
  </Block>
);

const WidgetDictationTranslation = ({ dark }: { dark: boolean }) => (
  <Block title="LanguagesPanel / TranslationField.tsx — other language: Transcribed (collapsed) + translation with Insert">
    <Widget
      dark={dark}
      height={330}
      view={{
        kind: 'languages', languages: FAVORITES.filter(({ code }) => code !== 'de' && code !== 'en'), detectedName: 'German', detectedLang: 'de', readOnly: true,
        translation: { lang: 'en', text: "I'll send you the report tomorrow.", lines: 1, onCopy: noop },
        dictation: { transcript: 'Ich schicke dir morgen den Bericht.', text: "I'll send you the report tomorrow.", onInsert: noop, onCopy: noop },
      }}
    />
  </Block>
);

const GrammarPanelShared = () => (
  <Block title="GrammarPanel.tsx — moved to components/, now shared by widget and popup (own GrammarView type)">
    <div className="w-[340px] rounded-2xl bg-tm-surface p-1.5 shadow-tm-pop">
      <GrammarPanel view={GRAMMAR} />
    </div>
  </Block>
);

const HomeStates = () => (
  <Block title="Home.tsx — mic on the text card; Listening card with live text; dictated English opens the grammar panel">
    <div className="flex flex-wrap gap-6">
      <PopupFrame><Home {...homeMeta.args} text="" recent={undefined} /></PopupFrame>
      <PopupFrame><Home {...homeMeta.args} text="" recent={undefined} from="de" dictation="listening" dictationLevel={0.6} dictationSeconds={6} dictationText="Ich schicke dir morgen den Bericht über das Projekt und die neuen Termine." /></PopupFrame>
      <PopupFrame><Home {...homeMeta.args} from="en" text="I has send the report yesterday and they was happy with it." recent={undefined} grammar={GRAMMAR} /></PopupFrame>
    </div>
  </Block>
);

const HistoryVoice = () => (
  <Block title="entries.tsx / history.ts — voice: true shows a mic right of the entry's icon (History cards + Home's Recent)">
    <div className="flex flex-wrap gap-6">
      <PopupFrame><History {...historyMeta.args} history={HISTORY} /></PopupFrame>
      <PopupFrame><Home {...homeMeta.args} text="" recent={HISTORY[1]} /></PopupFrame>
    </div>
  </Block>
);

const OptionsMic = () => (
  <Block title="SettingsPage.tsx — Microphone card (one grant for the offscreen recorder; picked out on options.html#mic)">
    <div className="w-[680px] overflow-hidden rounded-xl ring-1 ring-tm-subtle">
      <SettingsPage {...settingsMeta.args} mic="prompt" micRequested />
    </div>
  </Block>
);

// -- exports -------------------------------------------------------------------------------------

export const Overview: Story = {
  render: (_, { globals }) => {
    const dark = isDark(globals);
    return (
      <div className="flex flex-col gap-8">
        <MicInPill dark={dark} />
        <RecordingStates />
        <WidgetRecording dark={dark} />
        <WidgetDictationGrammar dark={dark} />
        <WidgetDictationTranslation dark={dark} />
        <GrammarPanelShared />
        <HomeStates />
        <HistoryVoice />
        <OptionsMic />
      </div>
    );
  },
};

export const TriggerMic: Story = { render: (_, { globals }) => <MicInPill dark={isDark(globals)} /> };
export const RecordingComponent: Story = { render: () => <RecordingStates /> };
export const WidgetRecordingPanel: Story = { render: (_, { globals }) => <WidgetRecording dark={isDark(globals)} /> };
export const DictationGrammar: Story = { render: (_, { globals }) => <WidgetDictationGrammar dark={isDark(globals)} /> };
export const DictationTranslation: Story = { render: (_, { globals }) => <WidgetDictationTranslation dark={isDark(globals)} /> };
export const SharedGrammarPanel: Story = { render: () => <GrammarPanelShared /> };
export const PopupHome: Story = { render: () => <HomeStates /> };
export const HistoryVoiceSign: Story = { render: () => <HistoryVoice /> };
export const OptionsMicrophone: Story = { render: () => <OptionsMic /> };
