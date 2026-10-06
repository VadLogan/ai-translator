import { describe, expect, it } from 'vitest';
import { signTicket, TICKET_SECONDS, verifyTicket } from './voiceTicket.ts';

const SECRET = 'test-secret';
const NOW = 1_800_000_000_000;

describe('voice tickets', () => {
  it('round-trips the user until it expires', async () => {
    const signed = (await signTicket('user-1', NOW, SECRET))!;
    expect(signed.expiresAt).toBe(NOW / 1000 + TICKET_SECONDS);
    expect(await verifyTicket(signed.ticket, NOW + 59_000, SECRET)).toBe('user-1');
    expect(await verifyTicket(signed.ticket, NOW + TICKET_SECONDS * 1000, SECRET)).toBeNull();
  });

  it('refuses a tampered ticket, another secret, and junk', async () => {
    const { ticket } = (await signTicket('user-1', NOW, SECRET))!;
    const [payload, signature] = ticket.split('.');
    const forged = `${btoa(JSON.stringify({ sub: 'user-2', exp: NOW / 1000 + 60 })).replace(/=+$/, '')}.${signature}`;
    expect(await verifyTicket(forged, NOW, SECRET)).toBeNull();
    expect(await verifyTicket(ticket, NOW, 'other-secret')).toBeNull();
    expect(await verifyTicket(`${payload}.`, NOW, SECRET)).toBeNull();
    expect(await verifyTicket('not a ticket', NOW, SECRET)).toBeNull();
    expect(await verifyTicket(`${ticket}.x`, NOW, SECRET)).toBeNull();
  });

  it('is off without a secret', async () => {
    expect(await signTicket('user-1', NOW, undefined)).toBeNull();
    expect(await verifyTicket('a.b', NOW, undefined)).toBeNull();
  });
});
