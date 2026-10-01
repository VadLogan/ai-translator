import OpenAI from 'openai';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { env } from '../../env.ts';

// Shared by the OpenAI calls (translate.ts, fix-grammar.ts, rewrite.ts): one key read, one model setting.
// Module-level is fine -- Supabase has the secrets before the isolate runs.
export const client = new OpenAI({
  apiKey: env('OPENAI_API_KEY'),
});

export const MODEL = env('OPENAI_MODEL') ?? 'gpt-5.6-luna';

// Speech to text (transcribe.ts).
export const TRANSCRIBE_MODEL = env('OPENAI_TRANSCRIBE_MODEL') ?? 'gpt-4o-transcribe';
// Live speech to text, streamed by the extension over a Realtime session (voiceSession.ts).
export const LIVE_TRANSCRIBE_MODEL = env('OPENAI_LIVE_TRANSCRIBE_MODEL') ?? 'gpt-live-transcribe';

// Detection, the guard and the error count (detect.ts, validateGuard.ts, grammarQuality.ts). Reads TYPESAFE_API_KEY.
export const typeSafeClient = new TypeSafeClient({ apiKey: env('TYPESAFE_API_KEY') });
