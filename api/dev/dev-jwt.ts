// JWT helpers for local development only. Deliberately free of app imports, so dev-token.ts can
// mint a token without loading translate.ts (which constructs the OpenAI client at module load).
import { env } from '../src/env.ts';

// The legacy shared secret `supabase start` prints. Not a secret, and never used in production.
// Named DEV_* rather than SUPABASE_*, because SUPABASE_-prefixed names are reserved by the platform.
export const DEV_JWT_SECRET = env('DEV_JWT_SECRET') ?? 'super-secret-jwt-token-with-at-least-32-characters-long';
const SUPABASE_URL = env('DEV_SUPABASE_URL') ?? 'http://127.0.0.1:54321';

function base64url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const decodeJson = (segment: string): Record<string, unknown> =>
  JSON.parse(new TextDecoder().decode(base64url(segment))) as Record<string, unknown>;

export function hmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const algorithm = { name: 'HMAC', hash: 'SHA-256' } as const;
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), algorithm, false, [usage]);
}

// GoTrue signs real sessions with asymmetric keys (ES256 by default), so verifying them needs the
// published key set. Cached for the process; restart the dev server if the stack is recreated.
let jwksCache: Promise<JsonWebKey[]> | null = null;

function jwks(): Promise<JsonWebKey[]> {
  jwksCache ??= fetch(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
    .then((response) => response.json() as Promise<{ keys?: JsonWebKey[] }>)
    .then((body) => body.keys ?? [])
    .catch(() => {
      jwksCache = null; // the stack may just not be up yet; retry on the next request
      return [];
    });
  return jwksCache;
}

const ASYMMETRIC = {
  ES256: { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' },
  RS256: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
} as const;

async function verifyAsymmetric(
  alg: string,
  kid: unknown,
  signature: Uint8Array<ArrayBuffer>,
  signed: Uint8Array<ArrayBuffer>,
) {
  const spec = ASYMMETRIC[alg as keyof typeof ASYMMETRIC];
  if (!spec) return false;

  const jwk = (await jwks()).find((key) => (key as { kid?: string }).kid === kid);
  if (!jwk) return false;

  const key = await crypto.subtle.importKey('jwk', jwk, spec, false, ['verify']);
  // JWT carries ECDSA signatures as raw r||s, which is what Web Crypto expects.
  return crypto.subtle.verify(
    'namedCurve' in spec ? { name: spec.name, hash: spec.hash } : spec.name,
    key,
    signature,
    signed,
  );
}

/**
 * True only for a well-formed, correctly signed, unexpired token.
 * HS256 covers tokens minted by dev-token.ts (and legacy stacks); everything else goes to JWKS,
 * which is how real GoTrue sessions are signed.
 */
export async function verifyJwt(
  token: string,
  { secret = DEV_JWT_SECRET, now = Date.now() } = {},
): Promise<boolean> {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return false;

  try {
    const { alg, kid } = decodeJson(header);
    const signed = new TextEncoder().encode(`${header}.${payload}`);
    const bytes = base64url(signature);

    const valid =
      alg === 'HS256'
        ? await crypto.subtle.verify('HMAC', await hmacKey(secret, 'verify'), bytes, signed)
        : await verifyAsymmetric(String(alg), kid, bytes, signed);
    if (!valid) return false;

    // An expired token must fail here exactly as it would at the real gateway.
    const { exp } = decodeJson(payload);
    return typeof exp !== 'number' || exp * 1000 > now;
  } catch {
    return false; // not base64, not JSON, or an unusable key
  }
}

/** Signs `claims` with the local dev secret. Used by dev-token.ts and by the gateway tests. */
export async function signJwt(claims: Record<string, unknown>, secret = DEV_JWT_SECRET): Promise<string> {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signed = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}`;
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), new TextEncoder().encode(signed));
  return `${signed}.${Buffer.from(signature).toString('base64url')}`;
}
