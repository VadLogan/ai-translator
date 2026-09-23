import type { Context } from 'hono';
import type { Settings } from '../../../shared/contract.ts';
import type { AppEnv } from '../utils/http.ts';
import { profilesRepository } from '../repositories/profiles.ts';

// Settings live server-side so they follow the user across devices; the extension keeps a
// chrome.storage copy as a cache. Awaited, unlike the translate save -- the caller needs the result.
export async function getSettings(c: Context<AppEnv>) {
  return c.json(await profilesRepository.settings(c.get('userId')));
}

export async function putSettings(c: Context<AppEnv>) {
  const settings = c.get('body') as Settings; // validate(parseSettings) ran first
  return c.json(await profilesRepository.saveSettings(c.get('userId'), settings));
}
