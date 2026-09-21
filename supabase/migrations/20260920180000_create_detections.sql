-- Every source-language detection: one row per menu opening, not per translation.
-- Mirrors `translations` on purpose -- same id/usage/error columns, same generated fingerprint --
-- so the two join on trace_id without a foreign key.
create table if not exists detections (
  id            uuid primary key,
  created_at    timestamptz not null default now(),
  -- Nullable, and `on delete set null`, so the row survives the account that made it.
  user_id       uuid references auth.users (id) on delete set null,
  text          text not null,
  -- text::bytea is the binary-coercible cast (immutable, unlike convert_to, which is only stable).
  trace_id      text generated always as (encode(sha256(text::bytea), 'hex')) stored,
  lang          text,      -- null when the provider failed
  -- Was the detection right? null = no feedback yet (the menu was closed without translating),
  -- true = the user translated with this language, false = the user overrode it. Written by
  -- POST /translate from the sourceLang the client sends back, never by the detection itself.
  verified      boolean,
  url           text,
  model         text,
  input_tokens  integer,
  output_tokens integer,
  total_tokens  integer,
  duration_ms   integer not null,
  error         text       -- null on success
);

create index if not exists detections_trace_id_idx on detections (trace_id);
