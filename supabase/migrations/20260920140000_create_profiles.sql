-- A user record we own. auth.users belongs to GoTrue and its schema can be rewritten by Supabase
-- migrations, so application columns live here instead and join on the shared uuid.
create table if not exists profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  avatar_url   text,
  -- Mirrors the extension's Settings object 1:1, so neither side translates field names.
  -- Defaults live in shared/contract.ts, not here, and are merged on read.
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- security definer + an empty search_path is the documented-safe shape for a trigger on auth
-- that writes into public.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Anyone who signed up before this migration. display_name/avatar_url come from OAuth provider
-- metadata, so they stay null for password users.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
