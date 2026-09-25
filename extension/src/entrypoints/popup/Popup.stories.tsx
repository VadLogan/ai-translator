import type { Meta, StoryObj } from '@storybook/react-vite';
import { PROVIDERS } from '../../auth/providers';
import type { HistoryEntry } from '../../settings/history';
import { Popup } from './Popup';

const noop = () => undefined;
const now = Date.now();
const at = (daysAgo: number, hour: number, minute: number) => {
  const date = new Date(now - daysAgo * 86_400_000);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
};
const HISTORY: HistoryEntry[] = [
  { text: 'Cześć, przesyłam wycenę na prace wykończeniowe…', result: "Hi, I'm sending over the quote for the finishing works.", from: 'pl', to: 'en', site: 'mail.google.com', at: at(0, 10, 24), rating: 'good' },
  { text: 'Підтверджую доставку плитки на четвер…', result: 'Confirming the tile delivery for Thursday.', from: 'uk', to: 'en', site: 'web.whatsapp.com', at: at(0, 9, 41) },
  { text: 'Could you split the estimate room by room?', result: 'Czy możesz rozbić kosztorys na pomieszczenia?', from: 'en', to: 'pl', site: 'app.slack.com', at: at(1, 18, 7), rating: 'bad' },
  { text: 'Dziękuję, termin pasuje.', result: 'Thank you, the date works.', from: 'pl', to: 'en', site: 'mail.google.com', at: at(1, 12, 5) },
];

const meta = {
  title: 'Popup/Popup',
  component: Popup,
  parameters: { layout: 'centered' },
  args: {
    screen: 'home',
    site: { host: 'shop.example.com', on: true },
    onToggleSite: noop,
    onOpenHistory: noop,
    onOpenSettings: noop,
    onBack: noop,
    from: 'pl',
    fromDetected: true,
    into: 'en',
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
    history: HISTORY,
    onRestore: noop,
    onRate: noop,
    onCopyEntry: noop,
    onRetryEntry: noop,
    onDelete: noop,
    onClearAll: noop,
    undo: null,
    favorites: ['en', 'pl', 'uk'],
    lately: [{ code: 'de', at: now - 2 * 86_400_000 }, { code: 'fr', at: now - 8 * 86_400_000 }],
    onChoose: noop,
  },
} satisfies Meta<typeof Popup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { text: '', from: undefined, fromDetected: false, history: [] } };

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

export const LanguagesInto: Story = { args: { screen: { pick: 'into' } } };

export const LanguagesFrom: Story = { args: { screen: { pick: 'from' } } };

export const History: Story = { args: { screen: 'history' } };

export const HistoryUndo: Story = { args: { screen: 'history', undo: { label: 'Deleted 1 translation', onUndo: noop } } };

export const HistoryEmpty: Story = { args: { screen: 'history', history: [] } };
