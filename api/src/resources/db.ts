import postgres from 'postgres';
import { env } from '../env.ts';

// SUPABASE_DB_URL is injected into a deployed function and by `supabase start`;
// DATABASE_URL stays as an override. Neither set (tests) = null = nothing is saved.
const url = env('DATABASE_URL') ?? env('SUPABASE_DB_URL');
// ponytail: max 1 because every isolate gets its own pool, and prepare:false so a
// transaction-mode pooler URL works too. Raise max only if saves start queueing.
export const sql = url ? postgres(url, { connect_timeout: 5, max: 1, prepare: false }) : null;
if (!sql) console.warn('[db] no DATABASE_URL/SUPABASE_DB_URL; translations are not saved');

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
