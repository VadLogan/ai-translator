import type { ReactNode } from 'react';
import { MAX_FAVORITE_LANGUAGES } from '../../../../shared/contract';
import { Kbd, PillButton } from '../../components/buttons';
import { BrandMark, Flag } from '../../components/icons';
import { RemovableChip, StatusChip, TextAreaCard } from '../../components/inputs';
import { Text, Wordmark } from '../../components/typography';
import { nativeName } from '../../core/languages';
import type { Account } from '../../messaging/messages';
import type { DisabledField } from '../../settings/disabled-fields';
import { AddLanguage } from './AddLanguage';
import type { MicState } from './hooks/useMicPermission';
import { Vocabulary, type VocabularyProps } from './Vocabulary';

const SECTIONS = [
  { id: 'account', title: 'Account' },
  { id: 'languages', title: 'Your languages' },
  { id: 'vocabulary', title: 'Vocabulary' },
  { id: 'sites', title: 'Disabled sites' },
  { id: 'fields', title: 'Turned-off fields' },
  { id: 'mic', title: 'Microphone' },
  { id: 'shortcuts', title: 'Shortcuts' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];
const titleOf = (id: SectionId) => SECTIONS.find((section) => section.id === id)!.title;

export interface SettingsPageProps extends VocabularyProps {
  version: string;
  /** The URL's #fragment: the section the nav picks out. */
  active: string;
  /** "Saved", or why a save or a read failed. */
  status: { message: string; isError: boolean };

  /** null = signed out, undefined = still loading. */
  account: Account | null | undefined;
  accountError: string;
  accountBusy: boolean;
  providers: readonly { id: string; name: string }[];
  onSignIn(providerId: string): void;
  onSignOut(): void;

  /** In menu order: the in-page menu numbers them 1–9. */
  favorites: readonly string[];
  onAddLanguage(code: string): void;
  onRemoveLanguage(code: string): void;

  /** One hostname per line, as typed. */
  sitesText: string;
  sitesDirty: boolean;
  onSitesChange(text: string): void;
  onSaveSites(): void;
  busy: boolean;

  disabledFields: readonly DisabledField[];
  onEnableField(field: DisabledField): void;

  mic: MicState;
  /** Opened by a dictation the permission blocked: the section is picked out. */
  micRequested: boolean;
  onAllowMic(): void;

  /** The key that opens the popup, as Chrome prints it; '' = not set, undefined = loading. */
  openPopupKey: string | undefined;
  onChangeShortcut(): void;
}

export function SettingsPage(props: SettingsPageProps) {
  const { version, active, status } = props;
  const current = SECTIONS.some((section) => section.id === active) ? active : SECTIONS[0].id;
  return (
    <div className="min-h-screen bg-tm-subtle font-tm text-tm-ink">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-tm-line bg-tm-surface px-4 md:px-7">
        <BrandMark size={32} />
        <Wordmark size={15} />
        <StatusChip tone="neutral">{version}</StatusChip>
      </header>

      <div className="mx-auto flex max-w-[1280px] gap-6 px-4 py-6 md:px-7">
        <nav aria-label="Settings sections" className="sticky top-[88px] hidden w-[232px] shrink-0 flex-col gap-3 self-start md:flex">
          <div className="flex flex-col gap-0.5 rounded-3xl bg-tm-surface p-1.5 shadow-tm-card">
            {SECTIONS.map(({ id, title }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={id === current ? 'location' : undefined}
                className="flex min-h-[38px] items-center rounded-2xl px-3 py-1.5 text-[14px] text-tm-ink outline-none hover:bg-tm-subtle focus-visible:shadow-tm-ring aria-[current]:bg-tm-neutral aria-[current]:font-medium"
              >
                {title}
              </a>
            ))}
          </div>
          <Text variant="groupLabel" tone="muted" as="p" className="px-2 font-normal leading-normal">
            Saved to your account, so they follow you to every signed-in browser. Turned-off fields stay in this one.
          </Text>
        </nav>

        <main className="flex min-w-0 max-w-[880px] grow flex-col gap-4">
          <div className="flex items-end gap-4 px-1">
            <span className="flex grow flex-col gap-0.5">
              <Text variant="pageTitle" as="h1">Settings</Text>
              <Text variant="body" tone="muted" as="p">Which languages the menu offers, where it stays off, and the keys that open it.</Text>
            </span>
            <span role="status" className={`tm-helper ${status.isError ? 'text-tm-danger-ink' : 'text-tm-muted'}`}>
              {status.message}
            </span>
          </div>
          <AccountSection {...props} />
          <LanguagesSection {...props} />
          <Section id="vocabulary" description="Words you are learning, and names, brands and terms kept exactly as written. In this browser.">
            <Vocabulary {...props} />
          </Section>
          <SitesSection {...props} />
          <FieldsSection {...props} />
          <MicSection {...props} />
          <ShortcutsSection {...props} />
        </main>
      </div>
    </div>
  );
}

function Section({ id, description, highlight, children }: { id: SectionId; description?: string; highlight?: boolean; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`flex scroll-mt-[88px] flex-col rounded-3xl bg-tm-surface px-5 pb-2 shadow-tm-card ${highlight ? 'ring-2 ring-tm-accent' : ''}`}
    >
      <div className="flex flex-col gap-0.5 pb-1 pt-3">
        <h2 id={`${id}-title`} className="text-[14px] font-semibold">{titleOf(id)}</h2>
        {description && <Text variant="helper" tone="muted">{description}</Text>}
      </div>
      <div className="flex flex-col divide-y divide-tm-line">{children}</div>
    </section>
  );
}

/** A row: what it is on the left, its control on the right. */
function Line({ label, hint, children }: { label: ReactNode; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center gap-4 py-2.5">
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="tm-body truncate">{label}</span>
        {hint && <Text variant="helper" tone="muted">{hint}</Text>}
      </span>
      {children}
    </div>
  );
}

function AccountSection({ account, accountError, accountBusy, providers, onSignIn, onSignOut }: SettingsPageProps) {
  return (
    <Section id="account" description="Translations and saving these settings need a signed-in account.">
      {account === undefined ? (
        <Line label="Loading…" />
      ) : account ? (
        <Line label={account.email ?? 'Signed in'}>
          <PillButton size="sm" isDisabled={accountBusy} onPress={onSignOut}>Sign out</PillButton>
        </Line>
      ) : (
        <div className="flex flex-wrap gap-2 py-2.5">
          {providers.map((provider) => (
            <PillButton key={provider.id} variant="primary" size="sm" isDisabled={accountBusy} onPress={() => onSignIn(provider.id)}>
              Sign in with {provider.name}
            </PillButton>
          ))}
        </div>
      )}
      {accountError && <Text variant="helper" className="py-2 text-tm-danger-ink">{accountError}</Text>}
    </Section>
  );
}

function LanguagesSection({ favorites, onAddLanguage, onRemoveLanguage }: SettingsPageProps) {
  return (
    <Section id="languages" description="They lead the in-page menu, numbered 1–9 in this order. New ones go last.">
      <div className="flex flex-wrap items-center gap-2 pb-3 pt-2">
        {favorites.map((code) => (
          <RemovableChip key={code} flag={<Flag lang={code} width={18} />} label={nativeName(code)} onRemove={() => onRemoveLanguage(code)} />
        ))}
        {favorites.length < MAX_FAVORITE_LANGUAGES && <AddLanguage exclude={favorites} onAdd={onAddLanguage} />}
      </div>
    </Section>
  );
}

function SitesSection({ sitesText, sitesDirty, onSitesChange, onSaveSites, busy }: SettingsPageProps) {
  return (
    <Section id="sites" description="The extension stays off on these sites and their subdomains. Login, email, phone and payment fields are always skipped.">
      <div className="flex flex-col items-start gap-3 pb-3 pt-2">
        <TextAreaCard
          label="One site per line"
          rows={4}
          placeholder="mybank.com"
          className="w-full"
          value={sitesText}
          onChange={(event) => onSitesChange(event.target.value)}
        />
        <PillButton variant="primary" size="sm" isDisabled={!sitesDirty || busy} onPress={onSaveSites}>Save sites</PillButton>
      </div>
    </Section>
  );
}

function FieldsSection({ disabledFields, onEnableField }: SettingsPageProps) {
  return (
    <Section id="fields" description="Fields you turned off from the icon's hover menu, in this browser. Changes apply at once.">
      {disabledFields.length === 0 ? (
        <Line label={<span className="text-tm-muted">None yet. Hover the icon in a field and press “Turn off in this field”.</span>} />
      ) : (
        disabledFields.map((field) => (
          <Line key={`${field.site}|${field.key}`} label={<><span className="font-medium">{field.site}</span> — {field.label}</>}>
            <PillButton size="sm" onPress={() => onEnableField(field)}>Turn back on</PillButton>
          </Line>
        ))
      )}
    </Section>
  );
}

function MicSection({ mic, micRequested, onAllowMic }: SettingsPageProps) {
  return (
    <Section id="mic" description="Voice input in the popup and in page fields. Allowed once, for the whole extension." highlight={micRequested && mic !== 'granted'}>
      {mic === 'granted' ? (
        <Line label={`Allowed.${micRequested ? ' You can close this tab and dictate again.' : ''}`} />
      ) : mic === 'denied' ? (
        <Line label={<span className="text-tm-danger-ink">Blocked. Allow it from the address bar's site settings, then reload this page.</span>} />
      ) : (
        <Line label="Not allowed yet">
          <PillButton variant="primary" size="sm" onPress={onAllowMic}>Allow microphone</PillButton>
        </Line>
      )}
    </Section>
  );
}

function ShortcutsSection({ openPopupKey, onChangeShortcut }: SettingsPageProps) {
  return (
    <Section id="shortcuts" description="Chrome keeps extension shortcuts on its own page; Change opens it.">
      <Line label="Open the popup">
        {openPopupKey !== undefined && <Kbd tone="row">{openPopupKey || 'Not set'}</Kbd>}
        <PillButton variant="ghost" size="sm" onPress={onChangeShortcut}>Change</PillButton>
      </Line>
      <Line label="Translate what is in the popup's box">
        <Kbd tone="row">⌘ ↵</Kbd>
      </Line>
      <Line label="Pick one of your languages in the in-page menu">
        <Kbd tone="row">1–9</Kbd>
      </Line>
    </Section>
  );
}
