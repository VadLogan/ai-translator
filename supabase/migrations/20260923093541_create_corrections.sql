-- Every grammar fix attempt. Mirrors `translations` / `detections` on purpose -- same id/usage/error
-- columns, same generated fingerprint -- so all three join on trace_id without a foreign key.
create table if not exists corrections (
  id            uuid primary key,
  created_at    timestamptz not null default now(),
  -- Nullable, and `on delete set null`, so the row survives the account that made it.
  user_id       uuid references auth.users (id) on delete set null,
  text          text not null,
  -- text::bytea is the binary-coercible cast (immutable, unlike convert_to, which is only stable).
  trace_id      text generated always as (encode(sha256(text::bytea), 'hex')) stored,
  result        text,      -- null when the provider failed
  url           text,
  model         text,
  input_tokens  integer,
  output_tokens integer,
  total_tokens  integer,
  duration_ms   integer not null,
  error         text       -- null on success
);

create index if not exists corrections_trace_id_idx on corrections (trace_id);
