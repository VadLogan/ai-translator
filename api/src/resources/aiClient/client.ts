import OpenAI from 'openai';
import { env } from '../../env.ts';

// Shared by every provider call (translate.ts, detect.ts): one key read, one model setting.
// Module-level is fine -- Supabase has the secrets before the isolate runs.
export const client = new OpenAI({
  apiKey: env('OPENAI_API_KEY'),
});

export const MODEL = env('OPENAI_MODEL') ?? 'gpt-5.6-luna';
