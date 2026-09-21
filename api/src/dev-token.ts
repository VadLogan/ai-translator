// Mints a signed dev token so curl works against the local server with no Supabase stack running.
// Usage: npm run token -w api [-- <user-uuid>]
//
// The default uuid is not a real auth.users row, so if DATABASE_URL is also set the save fails the
// foreign key and is logged (the translation itself still succeeds -- saving is fire-and-forget).
// Pass a real user's uuid when you want the row to land.
import { signJwt } from './dev-jwt.ts';

const sub = process.argv[2] ?? '00000000-0000-4000-8000-000000000000';

console.log(await signJwt({ role: 'authenticated', sub, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }));
