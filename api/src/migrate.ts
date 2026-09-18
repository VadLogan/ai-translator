// Applies api/migrations/*.sql in name order, each once, each in its own transaction.
// Run: npm run migrate -w api   (reads DATABASE_URL from api/.env)
import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[migrate] DATABASE_URL is not set');
  process.exit(1);
}

const dir = new URL('../migrations/', import.meta.url);
const sql = postgres(url, { connect_timeout: 5, onnotice: () => {} });

// ponytail: no lock, so two runners at once could both apply a file; add pg_advisory_lock if CI ever runs this in parallel.
try {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const applied = new Set((await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name));
  const pending = (await readdir(dir)).filter((f) => f.endsWith('.sql') && !applied.has(f)).sort();

  for (const name of pending) {
    const body = await readFile(new URL(name, dir), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${name})`;
    });
    console.info(`[migrate] applied ${name}`);
  }
  console.info(pending.length ? `[migrate] done, ${pending.length} applied` : '[migrate] up to date');
} finally {
  await sql.end();
}
