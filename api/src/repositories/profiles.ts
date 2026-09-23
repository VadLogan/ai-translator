import { DEFAULT_SETTINGS, type Settings } from '../../../shared/contract.ts';
import { sql } from '../resources/db.ts';

/**
 * The `profiles` row for a signed-in user. The repository owns the column mapping.
 *
 * The on_auth_user_created trigger creates the row (with identity columns) at sign-up. Writes
 * upsert anyway, so a user whose row is missing still gets working settings -- such a row has
 * null email/display_name, since only the trigger sees the provider metadata.
 */
export const profilesRepository = {
  async settings(userId: string): Promise<Settings> {
    if (!sql) return DEFAULT_SETTINGS;
    const [row] = await sql<{ settings: Partial<Settings> }[]>`
      select settings from profiles where id = ${userId}
    `;
    // Merged rather than returned raw, so a newly added setting needs no data migration.
    return { ...DEFAULT_SETTINGS, ...row?.settings };
  },

  async saveSettings(userId: string, settings: Settings): Promise<Settings> {
    if (!sql) return settings;
    await sql`
      insert into profiles (id, settings) values (${userId}, ${sql.json({ ...settings })})
      on conflict (id) do update set settings = excluded.settings
    `;
    return settings;
  },
};
