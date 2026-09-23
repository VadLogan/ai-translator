-- Every rewrite attempt. Mirrors `corrections` on purpose -- same id/usage/error columns, same
-- generated fingerprint -- so it joins translations/detections/corrections on trace_id. Plus `style`.
create table if not exists rewrites (
  id            uuid primary key,
  created_at    timestamptz not null default now(),
  -- Nullable, and `on delete set null`, so the row survives the account that made it.
  user_id       uuid references auth.users (id) on delete set null,
  text          text not null,
  -- text::bytea is the binary-coercible cast (immutable, unlike convert_to, which is only stable).
  trace_id      text generated always as (encode(sha256(text::bytea), 'hex')) stored,
  style         text not null, -- RewriteStyle: natural | formal
  result        text,          -- null when the provider failed
  url           text,
  model         text,
  input_tokens  integer,
  output_tokens integer,
  total_tokens  integer,
  duration_ms   integer not null,
  error         text           -- null on success
);

create index if not exists rewrites_trace_id_idx on rewrites (trace_id);
