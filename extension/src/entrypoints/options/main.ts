import { LANGUAGES } from '../../core/languages';
import { PROVIDERS } from '../../auth/providers';
import { sendMessage } from '../../messaging/messages';

const accountContainer = document.querySelector<HTMLDivElement>('#account')!;
const languagesContainer = document.querySelector<HTMLDivElement>('#languages')!;
const saveButton = document.querySelector<HTMLButtonElement>('#save')!;
const status = document.querySelector<HTMLSpanElement>('#status')!;

function setStatus(message: string, isError = false): void {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

/**
 * Sign-in runs in the background worker: chrome.identity is not available here, and the worker
 * is where the session is stored.
 */
async function renderAccount(): Promise<void> {
  const response = await sendMessage({ type: 'get-account' });
  if (!response.ok) return setStatus(response.error.message, true);

  if (response.data) {
    const signOut = button('Sign out', async () => {
      const result = await sendMessage({ type: 'sign-out' });
      if (!result.ok) return setStatus(result.error.message, true);
      await renderAccount();
    });
    const who = document.createElement('span');
    who.textContent = response.data.email ?? 'Signed in';
    return accountContainer.replaceChildren(who, signOut);
  }

  accountContainer.replaceChildren(
    ...PROVIDERS.map(({ id, name }) =>
      button(`Sign in with ${name}`, async () => {
        setStatus('');
        const result = await sendMessage({ type: 'sign-in', provider: id });
        if (!result.ok) return setStatus(result.error.message, true);
        await renderAccount();
      }),
    ),
  );
}

function button(label: string, onClick: () => Promise<void>): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', () => {
    element.disabled = true;
    void onClick().finally(() => (element.disabled = false));
  });
  return element;
}

// Settings come through the worker, which owns the access token and keeps the chrome.storage
// cache in step. Signed out or API down, it answers from that cache.
let favoriteLanguages: string[] = [];

async function init(): Promise<void> {
  await renderAccount();
  const response = await sendMessage({ type: 'get-settings' });
  if (!response.ok) return setStatus(response.error.message, true);

  favoriteLanguages = response.data.favoriteLanguages;
  const favorites = new Set(favoriteLanguages);
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
  const previous = favoriteLanguages;
  const checked = [...languagesContainer.querySelectorAll<HTMLInputElement>('input:checked')].map((c) => c.value);
  // Keep the user's existing order, append newly checked languages at the end.
  const next = [
    ...previous.filter((code) => checked.includes(code)),
    ...checked.filter((code) => !previous.includes(code)),
  ];

  saveButton.disabled = true;
  const response = await sendMessage({ type: 'save-settings', settings: { favoriteLanguages: next } });
  saveButton.disabled = false;
  if (!response.ok) return setStatus(response.error.message, true);

  favoriteLanguages = response.data.favoriteLanguages;
  setStatus('Saved');
  setTimeout(() => setStatus(''), 2000);
});

init().catch((error: unknown) => setStatus(error instanceof Error ? error.message : String(error), true));
