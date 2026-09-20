-- Where the extension was used, and what the translation cost in tokens.
-- Nullable throughout: rows written before this migration, provider failures (no usage),
-- and requests without a page URL (curl, the options page) all leave these empty.
alter table translations
  add column if not exists url           text,
  add column if not exists input_tokens  integer,
  add column if not exists output_tokens integer,
  add column if not exists total_tokens  integer;
