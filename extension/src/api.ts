import type { TranslateBody, TranslateErr, TranslateOk } from '../../shared/contract';

const BASE_URL = import.meta.env.WXT_API_URL ?? 'http://127.0.0.1:54321/functions/v1/api';

/** Calls the backend API, which owns translation; the extension never holds provider keys. */
export async function translate(body: TranslateBody, baseUrl = BASE_URL): Promise<TranslateOk> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(`Cannot reach the translation API at ${baseUrl}. Is it running?`, { cause: error });
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data as TranslateErr | null)?.error?.message ?? `API returned ${response.status}`);
  }
  return data as TranslateOk;
}
