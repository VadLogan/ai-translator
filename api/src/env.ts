const denoEnv = (globalThis as { Deno?: { env: { get(key: string): string | undefined } } }).Deno?.env;

/** Config under both runtimes: Deno.env when deployed to Supabase, process.env under vitest. */
export const env = (key: string): string | undefined => (denoEnv ? denoEnv.get(key) : process.env[key]);
