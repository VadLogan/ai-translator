import type { TranslateBody, TranslateOk } from '../../../shared/contract.ts';
import { sql } from '../db.ts';

/** One translation attempt, in app terms. The repository owns the `translations` column mapping. */
export interface TranslationRecord {
  id: string;
  /** `sub` of the signed-in user who asked for it. */
  userId: string;
  request: TranslateBody;
  result?: TranslateOk; // set on success
  error?: unknown; // set on failure
  durationMs: number;
}

export function toRow({ id, userId, request, result, error, durationMs }: TranslationRecord) {
  return {
    id,
    user_id: userId,
    text: request.text,
    target_lang: request.targetLang,
    source_lang: request.sourceLang ?? null,
    url: request.url ?? null,
    result: result?.text ?? null,
    detected_source_lang: result?.detectedSourceLang ?? null,
    model: result?.model ?? null,
    input_tokens: result?.usage?.inputTokens ?? null,
    output_tokens: result?.usage?.outputTokens ?? null,
    total_tokens: result?.usage?.totalTokens ?? null,
    duration_ms: durationMs,
    error: error === undefined ? null : String(error),
  };
}

export const translationsRepository = {
  async save(record: TranslationRecord): Promise<void> {
    if (!sql) return;
    await sql`insert into translations ${sql(toRow(record))}`;
  },
};
