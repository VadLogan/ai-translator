import type { Meta, StoryObj } from '@storybook/react-vite';
import { emptyTranscript, lineView, transcriptReducer, words, type TranscriptAction, type TranscriptState } from '../../../core/transcript';
import { whenLabel } from '../../../settings/meetings';
import { MEETINGS, noop } from '../fixtures';
import { PopupFrame } from '../Popup';
import { MeetingDetail } from './MeetingDetail';

const record = MEETINGS[0]!;
const lines = record.lines!;
const me = 'me';

/** The screen as `useMeetingDetail` would show it after `actions`. */
const linesAfter = (...actions: TranscriptAction[]) => {
  const checks = Object.fromEntries(lines.flatMap((l, i) => (l.errors === undefined ? [] : [[`l${i}`, { status: 'done' as const, errors: l.errors }]])));
  const state: TranscriptState = actions.reduce(transcriptReducer, emptyTranscript(checks));
  return lines.map((l, i) => lineView(state, { id: `l${i}`, t: l.t, text: l.text, me: l.speaker === me }, record.cast!.find((s) => s.id === l.speaker)!));
};

const pieces = words(lines[2]!.text);
const redFlag = { line: 'l2', from: pieces.findIndex((p) => p.text === 'red'), to: pieces.findIndex((p) => p.text === 'flag') };

const meta = {
  title: 'Popups/Toolbar/MeetingDetail',
  component: MeetingDetail,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <PopupFrame><Story /></PopupFrame>],
  args: {
    site: record.site,
    meta: whenLabel(record),
    speakers: record.cast!,
    lines: linesAfter(),
    summary: { status: 'idle' },
    notice: null,
    onBack: noop,
    onCopy: noop,
    onDelete: noop,
    onSummarize: noop,
    onHighlight: noop,
    onClearHighlight: noop,
    onAction: noop,
    onShowFixes: noop,
    onCloseResult: noop,
    onUndoVocab: noop,
  },
} satisfies Meta<typeof MeetingDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Transcript: Story = {};

export const WordsHighlighted: Story = { args: { lines: linesAfter({ type: 'highlight', highlight: redFlag }) } };

export const Explained: Story = {
  args: {
    lines: linesAfter(
      { type: 'result-start', line: 'l2', kind: 'explain', text: 'red flag' },
      { type: 'result-done', line: 'l2', kind: 'explain', result: { body: 'A warning sign that something may be wrong.', lang: 'en', examples: ['The late payments were a red flag.', 'Missing data is a red flag for us.'] } },
    ),
  },
};

export const FixesShown: Story = {
  args: {
    lines: linesAfter(
      { type: 'result-start', line: 'l1', kind: 'fix', text: lines[1]!.text },
      {
        type: 'result-done',
        line: 'l1',
        kind: 'fix',
        result: { fix: { text: 'Yes, I sent them to the team yesterday.', edits: [{ start: 7, end: 15, original: 'has send', replacement: 'sent', kind: 'error', reason: 'Past simple: "sent", with "yesterday".' }] } },
      },
    ),
  },
};

export const SummaryLoading: Story = { args: { summary: { status: 'loading' } } };

export const SummaryShown: Story = {
  args: {
    summary: {
      status: 'done',
      points: ['Conversion in Spain dropped versus last month; the new payment page is the suspect.', 'You send a short summary of the numbers.', 'Decision on Friday, after a follow-up call.'],
    },
  },
};

export const Copied: Story = { args: { notice: 'Copied' } };

/** Saved before transcripts were kept. */
export const NoTranscript: Story = { args: { lines: null, speakers: [] } };
