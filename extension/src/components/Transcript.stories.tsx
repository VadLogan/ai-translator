import type { Meta, StoryObj } from '@storybook/react-vite';
import { emptyTranscript, lineView, transcriptReducer, words, type TranscriptAction } from '../core/transcript';
import { TranscriptLine } from './Transcript';

const noop = () => undefined;
const OTHER = { id: 'l0', t: 15, text: 'Conversion in Spain looks lower, it is a bit of a red flag.', me: false };
const MINE = { id: 'l1', t: 22, text: 'I think it depend on the new payment page.', me: true };
const SPEAKER = { name: 'Speaker 2', color: '#0E7A3F' };
const YOU = { name: 'You', color: '#46699D' };

const view = (line: typeof OTHER, who: typeof SPEAKER, ...actions: TranscriptAction[]) => lineView(actions.reduce(transcriptReducer, emptyTranscript()), line, who);
const pieces = words(OTHER.text);
const redFlag: TranscriptAction = { type: 'highlight', highlight: { line: 'l0', from: pieces.findIndex((p) => p.text === 'red'), to: pieces.findIndex((p) => p.text === 'flag') } };

const meta = {
  title: 'Components/Transcript',
  component: TranscriptLine,
  decorators: [(Story) => <div className="w-[388px] rounded-[20px] bg-tm-surface p-1.5 font-tm text-tm-ink"><Story /></div>],
  args: {
    line: view(OTHER, SPEAKER),
    callbacks: { onHighlight: noop, onClearHighlight: noop, onAction: noop, onShowFixes: noop, onCloseResult: noop, onUndoVocab: noop },
  },
} satisfies Meta<typeof TranscriptLine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Press and drag across words to highlight them. */
export const OtherSpeaker: Story = {};
export const Highlighted: Story = { args: { line: view(OTHER, SPEAKER, redFlag) } };
export const Translated: Story = {
  args: { line: view(OTHER, SPEAKER, { type: 'result-start', line: 'l0', kind: 'translate', text: 'red flag' }, { type: 'result-done', line: 'l0', kind: 'translate', result: { body: 'тривожний сигнал', lang: 'uk' } }) },
};
export const AddedToVocabulary: Story = {
  args: { line: view(OTHER, SPEAKER, { type: 'result-start', line: 'l0', kind: 'vocab', text: 'red flag' }, { type: 'result-done', line: 'l0', kind: 'vocab', result: { body: 'a warning sign', lang: 'en' } }) },
};
export const Failed: Story = {
  args: { line: view(OTHER, SPEAKER, { type: 'result-start', line: 'l0', kind: 'explain', text: 'red flag' }, { type: 'result-error', line: 'l0', kind: 'explain' }) },
};
export const YourLineChecking: Story = { args: { line: view(MINE, YOU, { type: 'check-start', line: 'l1' }) } };
export const YourLineClean: Story = { args: { line: view(MINE, YOU, { type: 'check-done', line: 'l1', errors: 0 }) } };
export const YourLineErrors: Story = { args: { line: view(MINE, YOU, { type: 'check-done', line: 'l1', errors: 2 }) } };
export const YourLineFixes: Story = {
  args: {
    line: view(
      MINE,
      YOU,
      { type: 'check-done', line: 'l1', errors: 1 },
      { type: 'result-start', line: 'l1', kind: 'fix', text: MINE.text },
      { type: 'result-done', line: 'l1', kind: 'fix', result: { fix: { text: '', edits: [{ start: 11, end: 20, original: 'depend on', replacement: 'depends on', kind: 'error', reason: 'Third person singular needs "-s".' }] } } },
    ),
  },
};
