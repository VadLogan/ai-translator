import type { ApiErrorCode, TranslateBody, TranslateErr, TranslateOk } from '../../shared/contract';

const BASE_URL = import.meta.env.WXT_API_URL ?? 'http://127.0.0.1:54321/functions/v1/api';

/** An API error that kept its code, so callers can tell 401 from a network failure. */
export class ApiError extends Error {
  readonly code: ApiErrorCode | undefined;

  constructor(message: string, code?: ApiErrorCode, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** Calls the backend API, which owns translation; the extension never holds provider keys. */
export async function translate(body: TranslateBody, accessToken: string | null, baseUrl = BASE_URL): Promise<TranslateOk> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // host_permissions exempt the worker from CORS, so this header triggers no preflight.
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(`Cannot reach the translation API at ${baseUrl}. Is it running?`, undefined, { cause: error });
  }

  const data: unknown = await response.json().catch(() => null);
  // A 401 can come from the Supabase gateway before the API's handler runs, and its body has a
  // different shape ({code, message} rather than {error:{...}}). Derive this one from the status
  // so a signed-out user still gets the sign-in prompt instead of a generic failure.
  if (response.status === 401) throw new ApiError('Sign in to translate', 'unauthenticated');
  if (!response.ok) {
    const { message, code } = (data as TranslateErr | null)?.error ?? {};
    throw new ApiError(message ?? `API returned ${response.status}`, code);
  }
  return data as TranslateOk;
}
