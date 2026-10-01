import type { Meta, StoryObj } from '@storybook/react-vite';
import { findLanguage } from '../../core/languages';
import { TranslatorWidget } from './TranslatorWidget';
import type { WidgetView } from './view';

const FAVORITES = ['en', 'de', 'uk'].map((code) => findLanguage(code)!);

const PROVIDERS = [
  { id: 'google', name: 'Google' },
  { id: 'facebook', name: 'Facebook' },
];

const noop = () => undefined;

const meta = {
  title: 'Widgets/TranslatorWidget',
  component: TranslatorWidget,
  parameters: { layout: 'fullscreen' },
  args: {
    // Pretend a line of text was selected here; the widget positions itself against it.
    anchor: { x: 240, top: 160, bottom: 180 },
    callbacks: { onIconClick: noop, onLanguagePick: noop, onFixLayout: noop, onFixGrammar: noop, onOpenSettings: noop, onDisableField: noop },
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

export const FieldIconLayout = story({ kind: 'icon', field: true, badge: 'layout' });

export const SelectionIconLayout = story({ kind: 'icon', badge: 'layout' });

export const FieldIconGibberish = story({ kind: 'icon', field: true, badge: 'gibberish' });

export const FieldIconClean = story({ kind: 'icon', field: true, badge: 0 });

/** Hovered: the pill offering "Turn off in this field". */
export const FieldIconHover = story({ kind: 'icon', field: true, canDisable: true, hovered: true });

export const Menu = story({ kind: 'languages', languages: FAVORITES, detectedName: 'English', detectedLang: 'en', grammar: 3 });

/** Polish detected, and the user usually translates PL → UK: Ukrainian comes first, out of the list. */
export const MenuPairSuggested = story({ kind: 'languages', languages: FAVORITES.filter(({ code }) => code !== 'uk'), suggested: findLanguage('uk'), detectedName: 'Polish', detectedLang: 'pl', grammar: 0 });

export const MenuGrammarClean = story({ kind: 'languages', languages: FAVORITES, detectedName: 'English', detectedLang: 'en', grammar: 0 });

export const MenuDetecting = story({ kind: 'languages', languages: FAVORITES, grammar: 'checking' });

export const MenuWithLayoutFix = story({
  kind: 'languages',
  languages: FAVORITES,
  detectedName: 'wrong keyboard layout',
  layoutPreview: 'привет, как дела?',
});

export const MenuWithoutFavorites = story({ kind: 'languages', languages: [], detectedName: 'German' });

export const MenuPageText = story({ kind: 'languages', languages: FAVORITES, detectedName: 'English', detectedLang: 'en', readOnly: true });

/** Page text in Polish, pair PL → UK: the translation is asked by itself and shows under the detected line. */
export const Translated = story({
  kind: 'languages', languages: FAVORITES.filter(({ code }) => code !== 'uk'), detectedName: 'Polish', detectedLang: 'pl', readOnly: true,
  translation: { lang: 'uk', text: 'Привіт, як справи? Сподіваюся, у тебе все добре.', lines: 2, onCopy: noop },
});

/** The same, while the translation is still in flight: skeleton lines sized to the selection. */
export const Translating = story({
  kind: 'languages', languages: FAVORITES.filter(({ code }) => code !== 'uk'), detectedName: 'Polish', detectedLang: 'pl', readOnly: true,
  translation: { lang: 'uk', lines: 2, onCopy: noop },
});

export const Busy = story({ kind: 'busy', label: 'Перекладаю українською…' });

export const SignIn = story({ kind: 'signIn', providers: PROVIDERS, onPick: noop });

export const Error = story({ kind: 'error', message: 'Rate limit reached. Try again in a minute.', onBack: noop });

const fix = (text: string, original: string) => `<span class="fix" data-original="${original}">${text}</span>`;

const grammar = { onReplace: noop, onIgnore: noop, onReplaceAll: noop, onStep: noop, ignored: [] };
const sending = { kind: 'error', original: 'I send', replacement: "I'm sending", reason: 'Something happening now takes the present continuous.' } as const;
const estimate = { kind: 'error', original: 'estimte', replacement: 'estimate', reason: 'Spelling.' } as const;
const finishing = { kind: 'native', original: 'finish works', replacement: 'finishing work', reason: '"Work" here is uncountable; the trade is "finishing work".' } as const;

/** The corner icon's click: the first of the fix's edits, picked out in the text. */
export const Grammar = story({
  kind: 'grammar',
  lang: 'en',
  html: `${fix("I'm sending", 'I send')} you the updated ${fix('estimate', 'estimte')} for the ${fix('finishing work', 'finish works')}.`,
  edits: [sending, estimate, finishing],
  index: 0,
  ...grammar,
});

/** Stepped to a blue edit: correct, but not how a native speaker would put it. The first edit was ignored. */
export const GrammarNative = story({
  kind: 'grammar',
  lang: 'en',
  html: `${fix("I'm sending", 'I send')} you the updated ${fix('estimate', 'estimte')} for the ${fix('finishing work', 'finish works')}.`,
  edits: [estimate, finishing],
  index: 1,
  ...grammar,
  ignored: [0],
});

/** The last edit left: no stepper, no Replace all. */
export const GrammarLastEdit = story({ kind: 'grammar', lang: 'en', html: `the updated ${fix('estimate', 'estimte')}.`, edits: [estimate], index: 0, ...grammar });

export const GrammarNothingToFix = story({ kind: 'grammar', lang: 'en', html: 'Good morning, the updated estimate is attached.', edits: [], index: 0, ...grammar });

export const GrammarChecking = story({ kind: 'grammar', edits: [], index: 0, ...grammar });

export const Layout = story({ kind: 'layout', typed: 'Ghbdsn', fixed: 'Привіт', from: 'en', to: 'uk', onClose: noop });

export const NotText = story({ kind: 'notText' });

/** The field icon over a textarea with its underlines. */
export const FieldUnderlines: Story = {
  args: {
    view: { kind: 'icon', field: true, badge: 2 },
    dark: false,
    marks: [
      { kind: 'error', rects: [{ left: 120, bottom: 150, width: 56 }] },
      { kind: 'native', rects: [{ left: 60, bottom: 172, width: 84 }] },
    ],
  },
};
