import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../../shared/contract.ts';

const rows = vi.fn();
vi.mock('../db.ts', () => ({ sql: Object.assign((..._args: unknown[]) => rows(), { json: (v: unknown) => v }) }));

const { profilesRepository } = await import('./profiles.ts');

describe('profiles settings', () => {
  it('falls back to the defaults when the row has no settings yet', async () => {
    rows.mockResolvedValueOnce([{ settings: {} }]);
    await expect(profilesRepository.settings('u1')).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to the defaults when there is no row at all', async () => {
    rows.mockResolvedValueOnce([]);
    await expect(profilesRepository.settings('u1')).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('merges stored settings over the defaults, so a new setting needs no data migration', async () => {
    rows.mockResolvedValueOnce([{ settings: { unknownFutureKey: 1 } }]);
    await expect(profilesRepository.settings('u1')).resolves.toMatchObject(DEFAULT_SETTINGS);
  });

  it('prefers the stored value over the default', async () => {
    rows.mockResolvedValueOnce([{ settings: { favoriteLanguages: ['de', 'uk'] } }]);
    await expect(profilesRepository.settings('u1')).resolves.toEqual({ favoriteLanguages: ['de', 'uk'] });
  });
});
