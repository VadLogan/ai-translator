import type { Meta, StoryObj } from '@storybook/react-vite';
import { PROVIDERS } from '../../../auth/providers';
import { HISTORY, noop } from '../fixtures';
import { PopupFrame } from '../Popup';
import { Home } from './Home';

const meta = {
  title: 'Popups/Toolbar/Home',
  component: Home,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <PopupFrame><Story /></PopupFrame>],
  args: {
    site: { host: 'shop.example.com', on: true },
    onToggleSite: noop,
    onOpenHistory: noop,
    onOpenSettings: noop,
    from: 'pl',
    fromDetected: true,
    into: 'en',
    pairs: [{ from: 'pl', to: 'en' }, { from: 'uk', to: 'en' }],
    onPair: noop,
    onPick: noop,
    onSwap: noop,
    text: 'Cześć, przesyłam wycenę na prace wykończeniowe. Daj znać, czy terminy Wam pasują.',
    onTextChange: noop,
    onTranslate: noop,
    busy: false,
    result: null,
    version: 0,
    onVersion: noop,
    onRetry: noop,
    onCopy: noop,
    onInsert: noop,
    notice: null,
    providers: null,
    onSignIn: noop,
    recent: HISTORY[0],
    onRestore: noop,
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { text: '', from: undefined, fromDetected: false, recent: undefined, pairs: [] } };

/** One pair used so far: it is the default, and no chips. */
export const OnePair: Story = { args: { text: '', fromDetected: false, result: null, pairs: [{ from: 'pl', to: 'en' }] } };

export const Translated: Story = {
  args: {
    result: {
      lang: 'en',
      versions: [
        'Hi, I am sending the quote for the finishing work. Let me know if the dates work for you.',
        "Hi, I'm sending over the quote for the finishing works. Let me know whether the dates suit you.",
        'Hello, attached is the quote for the finishing works. Tell me if the dates suit you.',
      ],
    },
    version: 1,
  },
};

export const Busy: Story = { args: { busy: true } };

export const Error: Story = { args: { notice: { message: 'Rate limit reached. Try again in a minute.', isError: true } } };

export const SignedOut: Story = { args: { providers: PROVIDERS } };

export const SiteOff: Story = { args: { site: { host: 'mybank.com', on: false } } };
