-- Which provider model produced the translation. Nullable: rows written before this migration,
-- and provider failures, have none. Records what the provider reports it actually used, which can
-- be a dated snapshot of the model that was requested.
alter table translations
  add column if not exists model text;
