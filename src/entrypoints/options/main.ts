import { LANGUAGES } from '../../core/languages';
import { sendMessage } from '../../messaging/messages';
import { storageSettings } from '../../settings/storage-settings';

const providerSelect = document.querySelector<HTMLSelectElement>('#provider')!;
const languagesContainer = document.querySelector<HTMLDivElement>('#languages')!;
const saveButton = document.querySelector<HTMLButtonElement>('#save')!;
const status = document.querySelector<HTMLSpanElement>('#status')!;

function setStatus(message: string, isError = false): void {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

async function init(): Promise<void> {
  const [settings, providers] = await Promise.all([
    storageSettings.get(),
    sendMessage({ type: 'list-providers' }),
  ]);

  if (!providers.ok) {
    setStatus(providers.error.message, true);
    return;
  }
  providerSelect.replaceChildren(
    ...providers.data.map(({ id, displayName }) => new Option(displayName, id, false, id === settings.activeProviderId)),
  );

  const favorites = new Set(settings.favoriteLanguages);
  languagesContainer.replaceChildren(
    ...LANGUAGES.map(({ code, name }) => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = code;
      checkbox.checked = favorites.has(code);
      label.append(checkbox, `${name} (${code})`);
      return label;
    }),
  );
}

saveButton.addEventListener('click', async () => {
  const { favoriteLanguages: previous } = await storageSettings.get();
  const checked = [...languagesContainer.querySelectorAll<HTMLInputElement>('input:checked')].map((c) => c.value);
  // Keep the user's existing order, append newly checked languages at the end.
  const favoriteLanguages = [
    ...previous.filter((code) => checked.includes(code)),
    ...checked.filter((code) => !previous.includes(code)),
  ];

  await storageSettings.update({ activeProviderId: providerSelect.value, favoriteLanguages });
  setStatus('Saved');
  setTimeout(() => setStatus(''), 2000);
});

init().catch((error: unknown) => setStatus(error instanceof Error ? error.message : String(error), true));
