import type { Meta, StoryObj } from '@storybook/react-vite';
import { LATELY, noop } from '../fixtures';
import { PopupFrame } from '../Popup';
import { Languages } from './Languages';

const meta = {
  title: 'Popups/Toolbar/Languages',
  component: Languages,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <PopupFrame><Story /></PopupFrame>],
  args: { side: 'into', current: 'en', yours: ['en', 'pl', 'uk'], lately: LATELY, pinned: ['pl'], onTogglePin: noop, onBack: noop, onChoose: noop },
} satisfies Meta<typeof Languages>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Into: Story = {};

export const From: Story = { args: { side: 'from', current: 'pl' } };
