import type { RewriteBody, RewriteOk } from '../../../shared/contract.ts';
import { sql } from '../resources/db.ts';

/** One rewrite attempt, in app terms. The repository owns the `rewrites` column mapping. */
export interface RewriteRecord {
  id: string;
  /** `sub` of the signed-in user who asked for it. */
  userId: string;
  request: RewriteBody;
  result?: RewriteOk; // set on success
  error?: unknown; // set on failure
  durationMs: number;
}

export function toRow({ id, userId, request, result, error, durationMs }: RewriteRecord) {
  return {
    id,
    user_id: userId,
    text: request.text,
    style: request.style,
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

export const rewritesRepository = {
  async save(record: RewriteRecord): Promise<void> {
    if (!sql) return;
    await sql`insert into rewrites ${sql(toRow(record))}`;
  },
};
