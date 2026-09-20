-- Every translation attempt, successes and provider failures alike.
create table if not exists translations (
  id                   uuid primary key,
  created_at           timestamptz not null default now(),
  text                 text not null,
  target_lang          text not null,
  source_lang          text,
  result               text,          -- null when the provider failed
  detected_source_lang text,
  duration_ms          integer not null,
  error                text           -- null on success
);

-- Bookkeeping for the old hand-rolled runner (api/src/migrate.ts); the Supabase CLI owns migrations now.
drop table if exists schema_migrations;
