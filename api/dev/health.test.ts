import { describe, expect, it, vi } from 'vitest';
import { handler } from './health.ts';
import { checkDb } from './db.ts';

vi.mock('./db.ts', () => ({ checkDb: vi.fn() }));

describe('health', () => {
  it.each(['ok', 'disabled'] as const)('200s when the database is %s', async (db) => {
    vi.mocked(checkDb).mockResolvedValueOnce(db);
    const res = await handler();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, db });
  });

  it('503s when the database is down, so a load balancer stops routing here', async () => {
    vi.mocked(checkDb).mockResolvedValueOnce('down');
    const res = await handler();

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ ok: false, db: 'down' });
  });
});
