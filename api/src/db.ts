import postgres from 'postgres';

// Shared connection for the repositories. Unset DATABASE_URL (tests, offline dev) = null = nothing is saved.
export const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { connect_timeout: 5 }) : null;
if (!sql) console.warn('[db] DATABASE_URL not set; translations are not saved');

export async function checkDb(): Promise<'ok' | 'down' | 'disabled'> {
  if (!sql) return 'disabled';
  try {
    await sql`select 1`;
    return 'ok';
  } catch (error) {
    console.error('[db] health check failed', error);
    return 'down';
  }
}
