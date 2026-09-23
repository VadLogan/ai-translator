import type { FixGrammarBody, FixGrammarOk } from '../../../shared/contract.ts';
import { sql } from '../resources/db.ts';

/** One grammar fix attempt, in app terms. The repository owns the `corrections` column mapping. */
export interface CorrectionRecord {
  id: string;
  /** `sub` of the signed-in user who asked for it. */
  userId: string;
  request: FixGrammarBody;
  result?: FixGrammarOk; // set on success
  error?: unknown; // set on failure
  durationMs: number;
}

export function toRow({ id, userId, request, result, error, durationMs }: CorrectionRecord) {
  return {
    id,
    user_id: userId,
    text: request.text,
    url: request.url ?? null,
    result: result?.text ?? null,
    model: result?.model ?? null,
    input_tokens: result?.usage?.inputTokens ?? null,
    output_tokens: result?.usage?.outputTokens ?? null,
    total_tokens: result?.usage?.totalTokens ?? null,
    duration_ms: durationMs,
    error: error === undefined ? null : String(error),
  };
}

export const correctionsRepository = {
  async save(record: CorrectionRecord): Promise<void> {
    if (!sql) return;
    await sql`insert into corrections ${sql(toRow(record))}`;
  },
};
