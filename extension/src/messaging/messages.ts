import { browser } from 'wxt/browser';
import type { ApiErrorCode, TranslateOk } from '../../../shared/contract';
import type { ProviderId } from '../auth/providers';

export type Message =
  | { type: 'translate'; text: string; targetLang: string }
  | { type: 'open-options' }
  | { type: 'sign-in'; provider: ProviderId }
  | { type: 'sign-out' }
  | { type: 'get-account' };

/** Who is signed in, or null. The content script and options page both render from this. */
export interface Account {
  email?: string;
}

export interface ResponseMap {
  translate: TranslateOk;
  'open-options': void;
  'sign-in': Account;
  'sign-out': void;
  'get-account': Account | null;
}

/** Errors don't survive structured cloning, so they travel as plain data. */
export type Response<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: ApiErrorCode } };

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
