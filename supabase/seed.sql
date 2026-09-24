-- Local only (runs on `supabase db reset`, never on `db push`). The dev user that api/dev/dev-gateway.ts
-- signs signed-out requests in as, so their rows pass the auth.users foreign keys.
-- The on_auth_user_created trigger creates the matching profiles row.
insert into auth.users (id, aud, role, email)
values ('00000000-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'dev@localhost')
on conflict (id) do nothing;
