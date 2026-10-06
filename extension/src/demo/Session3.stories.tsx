import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Icon } from '../components/icons';
import { HISTORY, MEETINGS_TAB, noop } from '../popups/toolbar/fixtures';
import { PopupFrame } from '../popups/toolbar/Popup';
import { History } from '../popups/toolbar/screens/History';
import { Meetings, type MeetingsProps } from '../popups/toolbar/screens/Meetings';
import { MeetingPanel } from '../widgets/meeting/MeetingPanel';
import * as meeting from '../widgets/meeting/MeetingPanel.stories';
import type { MeetingView } from '../widgets/meeting/view';

const meta = { title: 'Demo/Session 3 — 2026-10-06 15:13', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const H6 = 'mb-2 text-xs font-bold uppercase tracking-wide text-tm-accent';

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h6 className={H6}>{title}</h6>
    {children}
  </section>
);

/** The meeting card is `position: fixed`; a transformed box becomes its containing block, so each state stays in its frame. */
const CardFrame = ({ children }: { children: ReactNode }) => (
  <div className="relative h-[560px] w-[448px] overflow-hidden rounded-xl border border-dashed border-tm-dash [transform:translateZ(0)]">{children}</div>
);

const view = (story: { args?: { view?: MeetingView } }) => story.args!.view!;
const CARD: [string, MeetingView][] = [
  ['MeetingPanel.tsx — listening: legend, transcript, live line', view(meeting.Listening)],
  ['MeetingPanel.tsx — paused', view(meeting.Paused)],
  ['MeetingPanel.tsx — Fix result: struck original, replacement, why', view(meeting.FixResult)],
  ['MeetingPanel.tsx — renaming a speaker', view(meeting.Renaming)],
  ['MeetingPanel.tsx — minimized', view(meeting.Minimized)],
  ['MeetingPanel.tsx — ended: End becomes Close; ending now saves a summary (new)', view(meeting.Ended)],
];

const meetingsTab = (over: Partial<MeetingsProps> = {}) => <PopupFrame><Meetings {...MEETINGS_TAB} hasSaved {...over} /></PopupFrame>;

const POPUP: [string, () => ReactNode][] = [
  [
    'History.tsx (new) — Texts | Meetings tabs above the filters; Texts unchanged',
    () => (
      <PopupFrame>
        <History history={HISTORY} onBack={noop} onRestore={noop} onToggleStar={noop} onCopyEntry={noop} onRetryEntry={noop} onDelete={noop} onClearAll={noop} undo={null} meetings={MEETINGS_TAB} />
      </PopupFrame>
    ),
  ],
  ['Meetings.tsx (new) — Start card, meetings by day, “audio is never kept”', () => meetingsTab()],
  ['Meetings.tsx (new) — after “copy a note for the chat”', () => meetingsTab({ notice: 'Copied — paste it into the meeting chat' })],
  ['Meetings.tsx (new) — production build / non-web tab: no Start card', () => meetingsTab({ startHost: null })],
  ['Meetings.tsx (new) — empty', () => meetingsTab({ meetings: [], hasSaved: false })],
  ['Meetings.tsx (new) — Clear all, then Undo', () => meetingsTab({ meetings: [], undo: { label: 'Cleared 3 meetings', onUndo: noop } })],
];

const ICONS = (
  <Block title="icons.tsx — pause, play, minimize icons">
    <div className="flex gap-4 text-tm-ink">
      {(['pause', 'play', 'minimize'] as const).map((name) => (
        <span key={name} className="flex items-center gap-1.5 text-[12px]">
          <Icon name={name} size={18} /> {name}
        </span>
      ))}
    </div>
  </Block>
);

const card = ([title, v]: [string, MeetingView], dark: boolean) => (
  <Block key={title} title={title}>
    <CardFrame>
      <MeetingPanel view={v} dark={dark} callbacks={meeting.default.args.callbacks} />
    </CardFrame>
  </Block>
);
const popup = ([title, render]: [string, () => ReactNode]) => (
  <Block key={title} title={title}>
    {render()}
  </Block>
);

export const Overview: Story = {
  render: (_args, { globals }) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start gap-8">{POPUP.map(popup)}</div>
      <div className="flex flex-wrap gap-8">{CARD.map((c) => card(c, globals['theme'] === 'dark'))}</div>
      {ICONS}
    </div>
  ),
};

const onePopup = (i: number): Story => ({ render: () => popup(POPUP[i]!) });
const oneCard = (i: number): Story => ({ render: (_args, { globals }) => card(CARD[i]!, globals['theme'] === 'dark') });

export const HistoryTabs = onePopup(0);
export const MeetingsTab = onePopup(1);
export const MeetingsNoteCopied = onePopup(2);
export const MeetingsNoStart = onePopup(3);
export const MeetingsEmpty = onePopup(4);
export const MeetingsUndo = onePopup(5);
export const CardListening = oneCard(0);
export const CardPaused = oneCard(1);
export const CardFixResult = oneCard(2);
export const CardRenaming = oneCard(3);
export const CardMinimized = oneCard(4);
export const CardEnded = oneCard(5);
export const Icons: Story = { render: () => ICONS };
