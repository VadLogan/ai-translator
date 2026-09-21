import type { Context } from 'hono';
import { fail, waitUntil, type AppEnv } from '../http.ts';

/** What a provider route's repository must accept. `translations` and `detections` both match. */
interface AttemptRepository<Req, Res> {
  save(record: {
    id: string;
    userId: string;
    request: Req;
    result?: Res;
    error?: unknown;
    durationMs: number;
  }): Promise<void>;
}

/**
 * One attempt at a provider route: the request id, the timing and the `→ ← ✗` log lines that
 * every such route repeats. The id on the log lines is the first 8 chars of the row the attempt
 * is saved as, so a log line and its row can be matched up.
 */
export function startAttempt(tag: string) {
  const rowId = crypto.randomUUID();
  const id = rowId.slice(0, 8);
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);

  return {
    /** For side tasks the controller fires itself, so their failures carry the same id. */
    error: (message: string, error: unknown) => console.error(`[${tag} ${id}] ${message}`, error),

    /** Calls the provider, logs and saves the outcome either way, and answers. */
    async run<Req, Res>(
      c: Context<AppEnv>,
      o: {
        request: Req;
        call: (request: Req) => Promise<Res>;
        repository: AttemptRepository<Req, Res>;
        /** The 502 message, the one line that is per route. */
        failure: string;
      },
    ): Promise<Response> {
      const userId = c.get('userId');
      const save = (outcome: { result?: Res; error?: unknown }) =>
        // Not awaited: saving must not slow down or fail the request.
        o.repository
          .save({ id: rowId, userId, request: o.request, ...outcome, durationMs: ms() })
          .catch((dbError) => console.error(`[${tag} ${id}] db save failed`, dbError));

      console.info(`[${tag} ${id}] → ${new Date().toISOString()}`, JSON.stringify(o.request, null, 2));
      try {
        const result = await o.call(o.request);
        console.info(`[${tag} ${id}] ← ${ms()}ms`, JSON.stringify(result, null, 2));
        waitUntil(save({ result }));
        return c.json(result);
      } catch (error) {
        console.error(`[${tag} ${id}] ✗ ${ms()}ms`, error);
        waitUntil(save({ error }));
        return fail(c, 502, 'provider-failed', o.failure);
      }
    },
  };
}
