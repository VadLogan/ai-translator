import type { Meta, StoryObj } from '@storybook/react-vite';
import { findLanguage } from '../../core/languages';
import { TranslatorWidget, type WidgetView } from './TranslatorWidget';

const FAVORITES = ['en', 'de', 'uk'].map((code) => findLanguage(code)!);

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
    callbacks: { onIconClick: noop, onLanguagePick: noop, onFixLayout: noop, onFixGrammar: noop, onOpenSettings: noop },
  },
  // The story's `dark` follows the toolbar's theme switch, so both themes are one click apart.
  render: (args, { globals }) => <TranslatorWidget {...args} dark={globals['theme'] === 'dark'} />,
} satisfies Meta<typeof TranslatorWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

const story = (view: WidgetView): Story => ({ args: { view, dark: false } });

export const Icon = story({ kind: 'icon' });

export const FieldIcon = story({ kind: 'icon', field: true });

export const FieldIconChecking = story({ kind: 'icon', field: true, checking: true });

export const FieldIconErrors = story({ kind: 'icon', field: true, badge: 3 });

export const FieldIconError = story({ kind: 'icon', field: true, badge: 'error' });

export const FieldIconClean = story({ kind: 'icon', field: true, badge: 0 });

export const Menu = story({ kind: 'languages', languages: FAVORITES, detectedName: 'English', detectedLang: 'en', grammar: 3 });

export const MenuGrammarClean = story({ kind: 'languages', languages: FAVORITES, detectedName: 'English', detectedLang: 'en', grammar: 0 });

export const MenuDetecting = story({ kind: 'languages', languages: FAVORITES, grammar: 'checking' });

export const MenuWithLayoutFix = story({
  kind: 'languages',
  languages: FAVORITES,
  detectedName: 'wrong keyboard layout',
  layoutPreview: 'привет, как дела?',
});

export const MenuWithoutFavorites = story({ kind: 'languages', languages: [], detectedName: 'German' });

export const Busy = story({ kind: 'busy', label: 'Перекладаю українською…' });

export const SignIn = story({ kind: 'signIn', providers: PROVIDERS, onPick: noop });

export const Error = story({ kind: 'error', message: 'Rate limit reached. Try again in a minute.', onBack: noop });

const fix = (text: string, original: string) => `<span class="fix" data-original="${original}">${text}</span>`;

export const GrammarFixed = story({
  kind: 'grammarFixed',
  lang: 'pl',
  html: `${fix('Dzień', 'Dzien')} dobry, w ${fix('załączniku', 'zalaczniku')} ${fix('przesyłam', 'przesylam')} zaktualizowany kosztorys na prace ${fix('wykończeniowe', 'wykonczeniowe')}.`,
  onReplace: noop,
  onCopy: noop,
  onRewrite: noop,
});

export const GrammarNothingToFix = story({
  kind: 'grammarFixed',
  lang: 'en',
  html: 'Good morning, the updated estimate is attached.',
  onReplace: noop,
  onCopy: noop,
  onRewrite: noop,
});

export const GrammarChecking = story({ kind: 'grammarFixed', onReplace: noop, onCopy: noop, onRewrite: noop });
