import type { Meta, StoryObj } from '@storybook/react-vite';
import { HISTORY, noop } from '../fixtures';
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
    onRate: noop,
    onCopyEntry: noop,
    onRetryEntry: noop,
    onDelete: noop,
    onClearAll: noop,
    undo: null,
  },
} satisfies Meta<typeof History>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Undo: Story = { args: { undo: { label: 'Deleted 1 translation', onUndo: noop } } };

export const Empty: Story = { args: { history: [] } };
