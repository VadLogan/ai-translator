-- Applied by `npm run migrate -w api`. Idempotent, so it is safe on a DB where schema.sql was already run by hand.
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
