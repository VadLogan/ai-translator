import type { Meta, StoryObj } from '@storybook/react-vite';
import { LANGUAGES } from '../../core/languages';
import { PROVIDERS } from '../../auth/providers';
import { OptionsPage } from './OptionsPage';

const noop = () => undefined;

const meta = {
  title: 'Options/OptionsPage',
  component: OptionsPage,
  parameters: { layout: 'fullscreen' },
  args: {
    account: null,
    providers: PROVIDERS,
    languages: LANGUAGES,
    favorites: ['en', 'de', 'uk'],
    status: { message: '', isError: false },
    busy: false,
    onSignIn: noop,
    onSignOut: noop,
    onFavoritesChange: noop,
    onSave: noop,
  },
} satisfies Meta<typeof OptionsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {};

export const Loading: Story = { args: { account: undefined } };

export const SignedIn: Story = { args: { account: { email: 'you@example.com' } } };

export const Saving: Story = { args: { account: { email: 'you@example.com' }, busy: true } };

export const Saved: Story = {
  args: { account: { email: 'you@example.com' }, status: { message: 'Saved', isError: false } },
};

export const Failed: Story = {
  args: { status: { message: 'Sign in to save your settings.', isError: true } },
};
