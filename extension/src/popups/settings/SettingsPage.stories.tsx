import type { Meta, StoryObj } from '@storybook/react-vite';
import { PROVIDERS } from '../../auth/providers';
import { SettingsPage } from './SettingsPage';

const noop = () => undefined;

const meta = {
  title: 'Popups/Settings',
  component: SettingsPage,
  parameters: { layout: 'fullscreen' },
  args: {
    version: '0.2.0',
    active: '',
    status: { message: '', isError: false },
    account: { email: 'you@example.com' },
    accountError: '',
    accountBusy: false,
    providers: PROVIDERS,
    onSignIn: noop,
    onSignOut: noop,
    favorites: ['en', 'pl', 'uk'],
    onAddLanguage: noop,
    onRemoveLanguage: noop,
    words: [
      { word: 'drag one’s feet', lang: 'en', meaning: 'зволікати', at: Date.now(), source: 'Meeting · meet.example.com',
        context: 'Just keep in mind the supplier is dragging their feet on the tiles.', hit: 'dragging their feet',
        examples: ['The council is dragging its feet on the permit.', 'Stop dragging your feet and book the plasterer.'] },
      { word: 'kosztorys', lang: 'pl', meaning: 'кошторис', at: Date.now() - 3 * 86_400_000, source: 'Translation · mail.example.com',
        context: 'W załączniku przesyłam zaktualizowany kosztorys.', hit: 'kosztorys', examples: ['Kosztorys nie obejmuje materiałów.'] },
    ],
    exceptions: [
      { term: 'TypeMeant', kind: 'Brand', replaces: ['type meant', 'Typemeant'] },
      { term: 'PRJ-2041', kind: 'Code', replaces: [] },
    ],
    onRemoveWord: noop,
    onListen: noop,
    onAddException: noop,
    onRemoveException: noop,
    sitesText: 'mybank.com\nmail.example.com',
    sitesDirty: false,
    onSitesChange: noop,
    onSaveSites: noop,
    busy: false,
    disabledFields: [{ site: 'teams.microsoft.com', key: 'div|data-tid=ckeditor', label: 'Type a message' }],
    onEnableField: noop,
    mic: 'granted',
    micRequested: false,
    onAllowMic: noop,
    openPopupKey: '⇧⌘L',
    onChangeShortcut: noop,
  },
} satisfies Meta<typeof SettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};

export const SignedOut: Story = { args: { account: null, status: { message: 'Sign in to save your settings.', isError: true } } };

export const Loading: Story = { args: { account: undefined, openPopupKey: undefined } };

export const Saved: Story = { args: { status: { message: 'Saved', isError: false } } };

export const SitesEdited: Story = { args: { sitesText: 'mybank.com\nmail.example.com\nintranet.local', sitesDirty: true } };

export const NothingTurnedOff: Story = { args: { disabledFields: [], openPopupKey: '', words: [], exceptions: [] } };

export const MicRequested: Story = { args: { active: 'mic', mic: 'prompt', micRequested: true } };

export const MicBlocked: Story = { args: { mic: 'denied' } };
