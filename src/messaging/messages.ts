import { browser } from 'wxt/browser';
import type { ProviderInfo } from '../core/registry';
import type { TranslateResult, TranslationErrorCode } from '../core/translator';

export type Message =
  | { type: 'translate'; text: string; targetLang: string }
  | { type: 'list-providers' }
  | { type: 'open-options' };

export interface ResponseMap {
  translate: TranslateResult;
  'list-providers': ProviderInfo[];
  'open-options': void;
}

/** Errors don't survive structured cloning, so they travel as plain data. */
export type Response<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: TranslationErrorCode } };

export function isMessage(value: unknown): value is Message {
  return typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'string';
}

export async function sendMessage<M extends Message>(message: M): Promise<Response<ResponseMap[M['type']]>> {
  try {
    return await browser.runtime.sendMessage(message);
  } catch (error) {
    // Typically "Extension context invalidated" after the extension reloads.
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, error: { message: `Extension unavailable: ${reason}. Reload the page.` } };
  }
}
