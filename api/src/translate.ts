import type { TranslateBody, TranslateOk } from '../../shared/contract.ts';

/**
 * Stand-in for a real provider: returns the same test message the extension's
 * mock used to produce. Swap the body for an API call when a provider is picked;
 * the key stays here, server-side.
 */
export async function translate({ text, targetLang }: TranslateBody): Promise<TranslateOk> {
  console.info(`[translate] ${new Date().toISOString()} → "${targetLang}": ${text}`);
  console.info(`ai-test-translate[${targetLang}] ${text}`);
  return { text: `ai-test-translate[${targetLang}] ${text}` };
}
