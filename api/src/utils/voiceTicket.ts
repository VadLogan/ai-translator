import { env } from '../env.ts';

/*
 * The live-dictation socket's pass. A browser WebSocket can't send an Authorization header, so the
 * gateway can't check a JWT on it: POST /voice-session (signed in, rate limited) signs a ticket for
 * the user, and the `voice` function (verify_jwt = false) opens a socket only for a valid one.
 * HMAC-SHA256 over {sub, exp} with VOICE_TICKET_SECRET, base64url, Web Crypto (Deno and Node alike).
 * Not single-use: it is stateless, so it is short-lived instead.
 */

export const TICKET_SECONDS = 60;

const encoder = new TextEncoder();
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (text: string) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const key = (secret: string) => crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

/** Null when VOICE_TICKET_SECRET is not set: live dictation is then off, and clients fall back to /transcribe. */
export async function signTicket(sub: string, now = Date.now(), secret = env('VOICE_TICKET_SECRET')): Promise<{ ticket: string; expiresAt: number } | null> {
  if (!secret) return null;
  const expiresAt = Math.floor(now / 1000) + TICKET_SECONDS;
  const payload = b64url(encoder.encode(JSON.stringify({ sub, exp: expiresAt })));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload)));
  return { ticket: `${payload}.${b64url(signature)}`, expiresAt };
}

/** The user the ticket was signed for, or null when it is malformed, forged or expired. */
export async function verifyTicket(ticket: string, now = Date.now(), secret = env('VOICE_TICKET_SECRET')): Promise<string | null> {
  if (!secret) return null;
  const [payload, signature, extra] = ticket.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await key(secret), fromB64url(signature), encoder.encode(payload));
    if (!valid) return null;
    const { sub, exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { sub?: unknown; exp?: unknown };
    return typeof sub === 'string' && typeof exp === 'number' && exp * 1000 > now ? sub : null;
  } catch {
    return null; // not base64url, not JSON
  }
}
