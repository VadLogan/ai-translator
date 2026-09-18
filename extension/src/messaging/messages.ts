import { browser } from 'wxt/browser';
import type { TranslateOk } from '../../../shared/contract';

export type Message = { type: 'translate'; text: string; targetLang: string } | { type: 'open-options' };

export interface ResponseMap {
  translate: TranslateOk;
  'open-options': void;
}

/** Errors don't survive structured cloning, so they travel as plain data. */
export type Response<T> = { ok: true; data: T } | { ok: false; error: { message: string } };

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
