// Supabase Edge Function entry (config: supabase/config.toml -> [functions.api]).
// The platform strips /functions/v1 and hands the app paths that start with the
// function name, so the routes live under app.ts's basePath('/api').
import { app } from './app.ts';

// Declared rather than imported: tsc runs with types:["node"] and never sees Deno.
declare const Deno: { serve(handler: (req: Request) => Response | Promise<Response>): void };

Deno.serve(app.fetch);
