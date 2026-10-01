import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  CheckboxGroup,
  Label,
  Spinner,
  TextArea,
} from '@heroui/react';
import type { Language } from '../../core/languages';
import type { Account } from '../../messaging/messages';
import type { DisabledField } from '../../settings/disabled-fields';
import type { MicState } from './useMicPermission';

export interface OptionsPageProps {
  /** null = signed out, undefined = still loading. */
  account: Account | null | undefined;
  providers: readonly { id: string; name: string }[];
  languages: readonly Language[];
  favorites: readonly string[];
  status: { message: string; isError: boolean };
  busy: boolean;
  onSignIn(providerId: string): void;
  onSignOut(): void;
  onFavoritesChange(codes: string[]): void;
  /** One hostname per line, as typed. */
  disabledSites: string;
  onDisabledSitesChange(text: string): void;
  /** Fields turned off from the in-page icon, in this browser only. */
  disabledFields: readonly DisabledField[];
  onEnableField(field: DisabledField): void;
  onSave(): void;
  /** The extension's microphone permission, for voice input. */
  mic: MicState;
  /** Opened by a dictation the permission blocked: the section is picked out. */
  micRequested: boolean;
  onAllowMic(): void;
}

export function OptionsPage({
  account,
  providers,
  languages,
  favorites,
  status,
  busy,
  onSignIn,
  onSignOut,
  onFavoritesChange,
  disabledSites,
  onDisabledSitesChange,
  disabledFields,
  onEnableField,
  onSave,
  mic,
  micRequested,
  onAllowMic,
}: OptionsPageProps) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">AI Translator</h1>
        <p className="text-sm text-muted">
          Select text in any input field, click the translate icon, and pick a language.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Translations require a signed-in account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row flex-wrap items-center gap-2">
          {account === undefined ? (
            <Spinner size="sm" />
          ) : account ? (
            <>
              <span className="text-sm">{account.email ?? 'Signed in'}</span>
              <Button variant="outline" size="sm" isDisabled={busy} onPress={onSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            providers.map((provider) => (
              <Button key={provider.id} variant="secondary" size="sm" isDisabled={busy} onPress={() => onSignIn(provider.id)}>
                Sign in with {provider.name}
              </Button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favorite languages</CardTitle>
          <CardDescription>These appear in the in-page menu.</CardDescription>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            aria-label="Favorite languages"
            value={[...favorites]}
            onChange={onFavoritesChange}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {languages.map((language) => (
              <Checkbox key={language.code} value={language.code}>
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Label>
                    {language.name} ({language.code})
                  </Label>
                </Checkbox.Content>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disabled sites</CardTitle>
          <CardDescription>
            The extension stays off on these sites and their subdomains. One per line, e.g. mybank.com.
            Login, email, phone and payment fields are always skipped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TextArea
            aria-label="Disabled sites"
            rows={4}
            placeholder="mybank.com"
            value={disabledSites}
            onChange={(event) => onDisabledSitesChange(event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Turned-off fields</CardTitle>
          <CardDescription>Fields you turned off from the icon's hover menu, in this browser. Changes apply at once.</CardDescription>
        </CardHeader>
        <CardContent>
          {disabledFields.length === 0 ? (
            <p className="text-sm text-muted">None yet. Hover the icon in a field and press “Turn off in this field”.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {disabledFields.map((field) => (
                <li key={`${field.site}|${field.key}`} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{field.site}</span> — {field.label}
                  </span>
                  <Button variant="outline" size="sm" onPress={() => onEnableField(field)}>
                    Turn back on
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card id="mic" className={micRequested && mic !== 'granted' ? 'ring-2 ring-accent' : undefined}>
        <CardHeader>
          <CardTitle>Microphone</CardTitle>
          <CardDescription>Voice input in the popup and in page fields. Allowed once, for the whole extension.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row items-center gap-3">
          {mic === 'granted' ? (
            <span className="text-sm">Allowed.{micRequested ? ' You can close this tab and dictate again.' : ''}</span>
          ) : mic === 'denied' ? (
            <span className="text-sm text-danger">Blocked. Allow it from the address bar's site settings, then reload this page.</span>
          ) : (
            <Button variant="primary" size="sm" onPress={onAllowMic}>Allow microphone</Button>
          )}
        </CardContent>
      </Card>

      <footer className="flex items-center gap-3">
        <Button variant="primary" isDisabled={busy} onPress={onSave}>
          Save
        </Button>
        <span role="status" className={`text-sm ${status.isError ? 'text-danger' : 'text-muted'}`}>
          {status.message}
        </span>
      </footer>
    </main>
  );
}
