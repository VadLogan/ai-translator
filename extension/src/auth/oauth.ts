import { browser } from 'wxt/browser';
import { storageSession, type Session } from './session';
import type { ProviderId } from './providers';

const SUPABASE_URL = import.meta.env.WXT_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = import.meta.env.WXT_SUPABASE_ANON_KEY ?? '';

/** Refresh this far before the token actually expires, so an in-flight request can't race it. */
const REFRESH_MARGIN_MS = 60_000;

/** PKCE verifier: 43-128 unreserved characters (RFC 7636). 32 random bytes base64url-encoded is 43. */
export function createVerifier(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function isExpired(session: Session, now = Date.now()): boolean {
  return session.expiresAt - REFRESH_MARGIN_MS <= now;
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Runs the OAuth flow in a browser-managed window and stores the resulting session.
 * Background worker only: chrome.identity is not exposed to content scripts.
 */
export async function signIn(provider: ProviderId): Promise<Session> {
  const verifier = createVerifier();
  const redirectUri = browser.identity.getRedirectURL();
  const authorize = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authorize.search = new URLSearchParams({
    provider,
    redirect_to: redirectUri,
    code_challenge: await challengeFor(verifier),
    code_challenge_method: 's256',
    // In the query, not a header: launchWebAuthFlow is a navigation and cannot set headers.
    apikey: ANON_KEY,
  }).toString();

  const redirect = await browser.identity.launchWebAuthFlow({ url: authorize.toString(), interactive: true });
  if (!redirect) throw new Error('Sign-in was cancelled.');

  const params = new URL(redirect).searchParams;
  const error = params.get('error_description') ?? params.get('error');
  if (error) throw new Error(`Sign-in failed: ${error}`);

  const code = params.get('code');
  if (!code) throw new Error('Sign-in did not return an authorization code.');

  return store(await token('pkce', { auth_code: code, code_verifier: verifier }));
}

/** The stored access token, refreshed first if it is at or near expiry. Null when signed out. */
export async function getAccessToken(): Promise<string | null> {
  const session = await storageSession.get();
  if (!session) return null;
  if (!isExpired(session)) return session.accessToken;

  try {
    return (await store(await token('refresh_token', { refresh_token: session.refreshToken }))).accessToken;
  } catch {
    // The refresh token was revoked or expired: treat it as signed out rather than retrying forever.
    await storageSession.clear();
    return null;
  }
}

export async function signOut(): Promise<void> {
  // Only local state: the refresh token expires on its own, and the UI needs nothing more.
  await storageSession.clear();
}

async function token(grantType: 'pkce' | 'refresh_token', body: Record<string, string>) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grantType}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: ANON_KEY },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data as { error_description?: string; msg?: string } | null)?.error_description;
    throw new Error(message ?? `Auth returned ${response.status}`);
  }
  return data as { access_token: string; refresh_token: string; expires_in: number; user?: { email?: string } };
}

async function store(payload: Awaited<ReturnType<typeof token>>): Promise<Session> {
  const session: Session = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    ...(payload.user?.email ? { email: payload.user.email } : {}),
  };
  await storageSession.set(session);
  return session;
}
