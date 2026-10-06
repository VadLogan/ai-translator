import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FixEdit } from '../../../../shared/contract';
import { words, type TranscriptAction } from '../../core/transcript';
import { MeetingPanel } from './MeetingPanel';
import { initialMeeting, meetingReducer, SPEAKER_COLORS, type MeetingAction, type MeetingState } from './state';
import { toView } from './view';

const noop = () => undefined;

const LINES = [
  { id: 'l0', speaker: 's1', t: 851, text: "Okay, let's kick off. Did everyone see the new booking numbers?" },
  { id: 'l1', speaker: 'me', t: 856, text: 'Yes, I has send them to the team yesterday.' },
  { id: 'l2', speaker: 's2', t: 861, text: 'Conversion in Spain looks lower than last month, it is a bit of a red flag.' },
  { id: 'l3', speaker: 'me', t: 866, text: 'Sure, I will send it by Wednesday evening.' },
  { id: 'l4', speaker: 's1', t: 870, text: "Good point. Let's touch base on Friday and decide." },
];

const edit = (text: string, original: string, replacement: string, reason: string): FixEdit => {
  const start = text.indexOf(original);
  return { start, end: start + original.length, original, replacement, kind: 'error', reason };
};

const t = (action: TranscriptAction): MeetingAction => ({ type: 'transcript', action });
/** The pieces of `phrase` in line `id`, as a highlight. */
const highlight = (id: string, phrase: string): MeetingAction => {
  const pieces = words(LINES.find((l) => l.id === id)!.text);
  const [first, ...rest] = phrase.split(' ');
  const from = pieces.findIndex((p) => p.text === first);
  const to = rest.length ? pieces.findIndex((p, i) => i > from && p.text === rest.at(-1)) : from;
  return t({ type: 'highlight', highlight: { line: id, from, to } });
};

const base: MeetingState = [t({ type: 'check-done', line: 'l1', errors: 1 }), t({ type: 'check-done', line: 'l3', errors: 0 })].reduce(meetingReducer, {
  ...initialMeeting([
    { id: 's1', name: 'Speaker 1', color: SPEAKER_COLORS[0] },
    { id: 's2', name: 'Speaker 2', color: SPEAKER_COLORS[1] },
    { id: 'me', name: 'You', color: SPEAKER_COLORS[2] },
  ]),
  elapsed: 872,
  lines: LINES,
  live: { speaker: 's2', text: "I'll ask them whether they can" },
});

const at = (...actions: MeetingAction[]) => toView(actions.reduce(meetingReducer, base));

const meta = {
  title: 'Widgets/MeetingPanel',
  component: MeetingPanel,
  parameters: { layout: 'fullscreen' },
  args: {
    view: at(),
    dark: false,
    callbacks: {
      onTogglePause: noop,
      onMinimize: noop,
      onEnd: noop,
      onRenameStart: noop,
      onRename: noop,
      onHighlight: noop,
      onClearHighlight: noop,
      onAction: noop,
      onShowFixes: noop,
      onCloseResult: noop,
      onUndoVocab: noop,
    },
  },
  render: (args, { globals }) => <MeetingPanel {...args} dark={globals['theme'] === 'dark'} />,
} satisfies Meta<typeof MeetingPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

const story = (...actions: MeetingAction[]): Story => ({ args: { view: at(...actions) } });

const FIX = { text: 'Yes, I have sent them to the team yesterday.', edits: [edit(LINES[1]!.text, 'has send', 'have sent', '“I” takes “have”, and the past participle of “send” is “sent”.')] };
const fixStart = t({ type: 'result-start', line: 'l1', kind: 'fix', text: LINES[1]!.text });

/** Your lines show their error count; other lines wait for a highlight. */
export const Listening = story();
export const Paused = story({ type: 'toggle-pause' });
/** A user's line still being checked. */
export const Checking = story(t({ type: 'check-start', line: 'l3' }));
/** Words highlighted on another speaker's line: Translate / Explain / Add to vocabulary. */
export const LineSelected = story(highlight('l2', 'red flag'));
export const Translated = story(
  t({ type: 'result-start', line: 'l2', kind: 'translate', text: 'red flag' }),
  t({ type: 'result-done', line: 'l2', kind: 'translate', result: { body: 'тривожний сигнал', lang: 'uk' } }),
);
export const Explained = story(
  t({ type: 'result-start', line: 'l4', kind: 'explain', text: 'touch base' }),
  t({ type: 'result-done', line: 'l4', kind: 'explain', result: { body: 'Коротко поговорити ще раз, щоб звірити, як справи.', lang: 'uk', examples: ["Let's touch base next week.", 'I will touch base with the client.'] } }),
);
export const AddedToVocabulary = story(
  t({ type: 'result-start', line: 'l4', kind: 'vocab', text: 'touch base' }),
  t({ type: 'result-done', line: 'l4', kind: 'vocab', result: { body: 'коротко поговорити ще раз', lang: 'en' } }),
);
/** "Show fixes" on your line: the fix under the original. */
export const FixLoading = story(fixStart);
export const FixResult = story(fixStart, t({ type: 'result-done', line: 'l1', kind: 'fix', result: { fix: FIX } }));
export const NothingToFix = story(fixStart, t({ type: 'result-done', line: 'l1', kind: 'fix', result: { fix: { text: LINES[1]!.text, edits: [] } } }));
export const FixFailed = story(fixStart, t({ type: 'result-error', line: 'l1', kind: 'fix' }));
export const Renaming = story({ type: 'rename-start', id: 's1' });
export const Minimized = story({ type: 'minimize' });
export const Ended = story({ type: 'end' });
export const Empty: Story = { args: { view: toView({ ...base, lines: [], live: null, elapsed: 3 }) } };
