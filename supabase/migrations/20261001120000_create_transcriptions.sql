-- Every voice-input attempt. The audio is not kept: only its size and type, and what was heard.
create table if not exists transcriptions (
  id            uuid primary key,
  created_at    timestamptz not null default now(),
  user_id       uuid references auth.users (id) on delete set null,
  url           text,
  mime_type     text not null,
  audio_bytes   integer not null,
  text          text,      -- null when the provider failed; '' when nothing was heard
  lang          text,
  model         text,
  duration_ms   integer not null,
  error         text       -- null on success
);
