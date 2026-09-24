import type {
  ApiErrorCode,
  DetectBody,
  DetectOk,
  FixGrammarBody,
  FixGrammarOk,
  RewriteBody,
  RewriteOk,
  Settings,
  TranslateBody,
  TranslateErr,
  TranslateOk,
} from '../../shared/contract';

// Defaults to the local Node server (`npm run dev:api`). The edge runtime serves the same paths
// on :54321, so switching between them is an origin change only.
const BASE_URL = import.meta.env.WXT_API_URL ?? 'http://127.0.0.1:8787/functions/v1/api';

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
export const translate = (body: TranslateBody, accessToken: string | null, baseUrl = BASE_URL) =>
  call<TranslateOk>('/translate', { method: 'POST', body }, accessToken, baseUrl);

/** What language is the selection in? Asked when the menu opens, before a target is picked. */
export const detect = (body: DetectBody, accessToken: string | null, baseUrl = BASE_URL) =>
  call<DetectOk>('/detect', { method: 'POST', body }, accessToken, baseUrl);

/** The whole field's text with grammar, spelling and punctuation fixed. `signal` cancels it. */
export const fixGrammar = (body: FixGrammarBody, accessToken: string | null, signal?: AbortSignal, baseUrl = BASE_URL) =>
  call<FixGrammarOk>('/fix-grammar', { method: 'POST', body, signal }, accessToken, baseUrl);

export const rewrite = (body: RewriteBody, accessToken: string | null, baseUrl = BASE_URL) =>
  call<RewriteOk>('/rewrite', { method: 'POST', body }, accessToken, baseUrl);

/** Settings live server-side so they follow the user across devices. */
export const getSettings = (accessToken: string | null, baseUrl = BASE_URL) =>
  call<Settings>('/settings', {}, accessToken, baseUrl);

export const saveSettings = (settings: Settings, accessToken: string | null, baseUrl = BASE_URL) =>
  call<Settings>('/settings', { method: 'PUT', body: settings }, accessToken, baseUrl);

async function call<T>(
  path: string,
  { method = 'GET', body, signal }: { method?: string; body?: unknown; signal?: AbortSignal },
  accessToken: string | null,
  baseUrl: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        // host_permissions exempt the worker from CORS, so this header triggers no preflight.
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw new ApiError('Cancelled', undefined, { cause: error });
    throw new ApiError(`Cannot reach the API at ${baseUrl}. Is it running?`, undefined, { cause: error });
  }

  const data: unknown = await response.json().catch(() => null);
  if (signal?.aborted) throw new ApiError('Cancelled'); // aborted mid-body: json() gave up, data is not the answer
  // A 401 can come from the Supabase gateway before the API's handler runs, and its body has a
  // different shape ({code, message} rather than {error:{...}}). Derive this one from the status
  // so a signed-out user still gets the sign-in prompt instead of a generic failure.
  if (response.status === 401) throw new ApiError('Sign in to translate', 'unauthenticated');
  if (!response.ok) {
    const { message, code } = (data as TranslateErr | null)?.error ?? {};
    throw new ApiError(message ?? `API returned ${response.status}`, code);
  }
  return data as T;
}
