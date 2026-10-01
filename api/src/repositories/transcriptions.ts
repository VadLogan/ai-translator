import type { TranscribeBody, TranscribeOk } from '../../../shared/contract.ts';
import { sql } from '../resources/db.ts';

/** One dictation attempt, in app terms. The audio itself is never stored, only its size and type. */
export interface TranscriptionRecord {
  id: string;
  userId: string;
  request: TranscribeBody;
  result?: TranscribeOk; // set on success
  error?: unknown; // set on failure
  durationMs: number;
}

export function toRow({ id, userId, request, result, error, durationMs }: TranscriptionRecord) {
  return {
    id,
    user_id: userId,
    url: request.url ?? null,
    mime_type: request.audio.type,
    audio_bytes: request.audio.size,
    text: result?.text ?? null,
    lang: result?.lang ?? null,
    model: result?.model ?? null,
    duration_ms: durationMs,
    error: error === undefined ? null : String(error),
  };
}

export const transcriptionsRepository = {
  async save(record: TranscriptionRecord): Promise<void> {
    if (!sql) return;
    await sql`insert into transcriptions ${sql(toRow(record))}`;
  },
};
