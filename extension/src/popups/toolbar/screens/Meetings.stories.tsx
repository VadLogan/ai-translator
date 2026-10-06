import type { Meta, StoryObj } from '@storybook/react-vite';
import { MEETINGS_TAB, noop } from '../fixtures';
import { PopupFrame } from '../Popup';
import { Meetings } from './Meetings';

const meta = {
  title: 'Popups/Toolbar/Meetings',
  component: Meetings,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <PopupFrame><Story /></PopupFrame>],
  args: { ...MEETINGS_TAB, hasSaved: true },
} satisfies Meta<typeof Meetings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMeetings: Story = {};

export const Empty: Story = { args: { meetings: [], hasSaved: false } };

/** Production builds, or a tab that isn't a web page: no Start card. */
export const NoStart: Story = { args: { startHost: null } };

export const NoteCopied: Story = { args: { notice: 'Copied — paste it into the meeting chat' } };

export const Undo: Story = { args: { meetings: [], undo: { label: 'Cleared 3 meetings', onUndo: noop } } };
