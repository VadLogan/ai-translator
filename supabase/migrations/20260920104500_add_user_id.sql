-- Who asked for the translation. Nullable: rows written before auth existed have no user,
-- and `on delete set null` keeps the audit row when an account is deleted.
alter table translations
  add column if not exists user_id uuid references auth.users (id) on delete set null;
