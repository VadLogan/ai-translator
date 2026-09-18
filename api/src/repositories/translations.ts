import type { TranslateBody, TranslateOk } from '../../../shared/contract.ts';
import { sql } from '../db.ts';

/** One translation attempt, in app terms. The repository owns the `translations` column mapping. */
export interface TranslationRecord {
  id: string;
  request: TranslateBody;
  result?: TranslateOk; // set on success
  error?: unknown; // set on failure
  durationMs: number;
}

export function toRow({ id, request, result, error, durationMs }: TranslationRecord) {
  return {
    id,
    text: request.text,
    target_lang: request.targetLang,
    source_lang: request.sourceLang ?? null,
    result: result?.text ?? null,
    detected_source_lang: result?.detectedSourceLang ?? null,
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
