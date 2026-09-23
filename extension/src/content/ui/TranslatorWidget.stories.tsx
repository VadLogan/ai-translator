import type { Meta, StoryObj } from '@storybook/react-vite';
import { TranslatorWidget, type WidgetView } from './TranslatorWidget';

const FAVORITES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'uk', name: 'Ukrainian' },
];

const PROVIDERS = [
  { id: 'google', name: 'Google' },
  { id: 'facebook', name: 'Facebook' },
];

const noop = () => undefined;

const meta = {
  title: 'Content/TranslatorWidget',
  component: TranslatorWidget,
  parameters: { layout: 'fullscreen' },
  args: {
    // Pretend a line of text was selected here; the widget positions itself against it.
    anchor: { x: 240, top: 160, bottom: 180 },
    callbacks: { onIconClick: noop, onLanguagePick: noop, onFixLayout: noop, onOpenSettings: noop },
  },
  // The story's `dark` follows the toolbar's theme switch, so both themes are one click apart.
  render: (args, { globals }) => <TranslatorWidget {...args} dark={globals['theme'] === 'dark'} />,
} satisfies Meta<typeof TranslatorWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

const story = (view: WidgetView): Story => ({ args: { view, dark: false } });

export const Icon = story({ kind: 'icon' });

export const Menu = story({ kind: 'languages', languages: FAVORITES, detectedName: 'English', detectedLang: 'en' });

export const MenuDetecting = story({ kind: 'languages', languages: FAVORITES });

export const MenuWithLayoutFix = story({
  kind: 'languages',
  languages: FAVORITES,
  detectedName: 'wrong keyboard layout',
  layoutPreview: 'привет, как дела?',
});

export const MenuWithoutFavorites = story({ kind: 'languages', languages: [], detectedName: 'German' });

export const Busy = story({ kind: 'busy', languageName: 'Ukrainian' });

export const SignIn = story({ kind: 'signIn', providers: PROVIDERS, onPick: noop });

export const Error = story({ kind: 'error', message: 'Rate limit reached. Try again in a minute.', onBack: noop });
