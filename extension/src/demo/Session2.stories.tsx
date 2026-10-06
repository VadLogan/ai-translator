import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Icon } from '../components/icons';
import { MeetingPanel } from '../widgets/meeting/MeetingPanel';
import * as meeting from '../widgets/meeting/MeetingPanel.stories';
import type { MeetingView } from '../widgets/meeting/view';

const meta = { title: 'Demo/Session 2 — 2026-10-06 14:55', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const H6 = 'mb-2 text-xs font-bold uppercase tracking-wide text-tm-accent';

/** The card is `position: fixed`; a transformed box becomes its containing block, so each state stays in its own frame. */
function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h6 className={H6}>{title}</h6>
      <div className="relative h-[560px] w-[448px] overflow-hidden rounded-xl border border-dashed border-tm-dash [transform:translateZ(0)]">{children}</div>
    </section>
  );
}

const view = (story: { args?: { view?: MeetingView } }) => story.args!.view!;
const Panel = ({ v, dark }: { v: MeetingView; dark: boolean }) => <MeetingPanel view={v} dark={dark} callbacks={meeting.default.args.callbacks} />;

const STATES: [string, MeetingView][] = [
  ['MeetingPanel.tsx (new) — listening: legend, transcript, live line with pulsing dot', view(meeting.Listening)],
  ['MeetingPanel.tsx (new) — paused: Play button, amber dot, no live line', view(meeting.Paused)],
  ['MeetingPanel.tsx (new) — clicked line shows its Fix pill', view(meeting.LineSelected)],
  ['MeetingPanel.tsx (new) — Fix loading skeleton', view(meeting.FixLoading)],
  ['MeetingPanel.tsx (new) — Fix result: struck original, replacement, why (view.ts fixParts)', view(meeting.FixResult)],
  ['MeetingPanel.tsx (new) — Fix with nothing to change', view(meeting.NothingToFix)],
  ['MeetingPanel.tsx (new) — Fix failed', view(meeting.FixFailed)],
  ['MeetingPanel.tsx (new) — renaming a speaker inline', view(meeting.Renaming)],
  ['MeetingPanel.tsx (new) — minimized to the header', view(meeting.Minimized)],
  ['MeetingPanel.tsx (new) — ended: End becomes Close, clock stops', view(meeting.Ended)],
  ['MeetingPanel.tsx (new) — empty transcript', view(meeting.Empty)],
];

const ICONS = (
  <section>
    <h6 className={H6}>icons.tsx — new pause, play, minimize icons</h6>
    <div className="flex gap-4 text-tm-ink">
      {(['pause', 'play', 'minimize'] as const).map((name) => (
        <span key={name} className="flex items-center gap-1.5 text-[12px]">
          <Icon name={name} size={18} /> {name}
        </span>
      ))}
    </div>
  </section>
);

export const Overview: Story = {
  render: (_args, { globals }) => (
    <div className="flex flex-col gap-8">
      {ICONS}
      <div className="flex flex-wrap gap-8">
        {STATES.map(([title, v]) => (
          <Frame key={title} title={title}>
            <Panel v={v} dark={globals['theme'] === 'dark'} />
          </Frame>
        ))}
      </div>
    </div>
  ),
};

const one = (index: number): Story => ({
  render: (_args, { globals }) => (
    <Frame title={STATES[index]![0]}>
      <Panel v={STATES[index]![1]} dark={globals['theme'] === 'dark'} />
    </Frame>
  ),
});

export const Icons: Story = { render: () => ICONS };
export const Listening = one(0);
export const Paused = one(1);
export const LineSelected = one(2);
export const FixLoading = one(3);
export const FixResult = one(4);
export const NothingToFix = one(5);
export const FixFailed = one(6);
export const Renaming = one(7);
export const Minimized = one(8);
export const Ended = one(9);
export const Empty = one(10);
