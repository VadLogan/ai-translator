import type { Meta, StoryObj } from '@storybook/react-vite';
import { HISTORY, MEETINGS_TAB, noop } from '../fixtures';
import { PopupFrame } from '../Popup';
import { History } from './History';

const meta = {
  title: 'Popups/Toolbar/History',
  component: History,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <PopupFrame><Story /></PopupFrame>],
  args: {
    history: HISTORY,
    onBack: noop,
    onRestore: noop,
    onToggleStar: noop,
    onCopyEntry: noop,
    onRetryEntry: noop,
    onDelete: noop,
    onClearAll: noop,
    undo: null,
    meetings: MEETINGS_TAB,
    tab: 'texts',
    onTab: noop,
  },
} satisfies Meta<typeof History>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Undo: Story = { args: { undo: { label: 'Deleted 1 translation', onUndo: noop } } };

export const Empty: Story = { args: { history: [] } };

/** Opens on the Meetings tab: the Start card, meetings by day, the audio note. */
export const MeetingsTab: Story = { args: { tab: 'meetings' } };

export const MeetingsTabEmpty: Story = { args: { tab: 'meetings', meetings: { ...MEETINGS_TAB, meetings: [] } } };
