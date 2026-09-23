import type { DetectBody, DetectOk } from '../../../shared/contract.ts';
import { sql } from '../resources/db.ts';

/** One detection attempt, in app terms. The repository owns the `detections` column mapping. */
export interface DetectionRecord {
  id: string;
  /** `sub` of the signed-in user who asked for it. */
  userId: string;
  request: DetectBody;
  result?: DetectOk; // set on success
  error?: unknown; // set on failure
  durationMs: number;
}

export function toRow({ id, userId, request, result, error, durationMs }: DetectionRecord) {
  return {
    id,
    user_id: userId,
    text: request.text,
    url: request.url ?? null,
    lang: result?.lang ?? null,
    model: result?.model ?? null,
    input_tokens: result?.usage?.inputTokens ?? null,
    output_tokens: result?.usage?.outputTokens ?? null,
    total_tokens: result?.usage?.totalTokens ?? null,
    duration_ms: durationMs,
    error: error === undefined ? null : String(error),
    // `verified` is left out: null until POST /translate reports what the user actually used.
  };
}

export const detectionsRepository = {
  async save(record: DetectionRecord): Promise<void> {
    if (!sql) return;
    await sql`insert into detections ${sql(toRow(record))}`;
  },

  /**
   * Records whether the detection was right, from the sourceLang the client translated with.
   * Matched on the generated fingerprint of the text rather than an id, so the client needs to
   * carry nothing but the language -- the same join `trace_id` gives us against `translations`.
   * ::text::bytea, not ::bytea: a bare cast would type the bind parameter as bytea and Postgres
   * would parse the string as escaped binary instead of hashing its characters.
   * Only the user's latest detection of that text is touched; older attempts keep their verdict.
   */
  async verify(userId: string, text: string, sourceLang: string): Promise<void> {
    if (!sql) return;
    await sql`
      update detections set verified = (lang = ${sourceLang})
      where id = (
        select id from detections
        where user_id = ${userId} and trace_id = encode(sha256(${text}::text::bytea), 'hex')
        order by created_at desc limit 1
      )
    `;
  },
};
