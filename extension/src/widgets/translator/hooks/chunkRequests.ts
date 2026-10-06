import type { Response } from '../../../messaging/messages';
import { isVerdict, type Verdict } from '../state';

const CACHE = 100; // texts remembered per field

/**
 * One API call per piece of a field's text (a sentence's /check, a paragraph's /fix-grammar), each
 * text asked once and remembered per field: an edit re-asks only what it touched, undo or coming
 * back to the field asks nothing. At most `limit` in flight; the rest queue. A failure isn't
 * remembered: the next round asks again. A guard verdict is remembered like an answer.
 */
export function chunkRequests<T>(ask: (text: string, id: string) => Promise<Response<T>>, cancel: (id: string) => void, limit = 2) {
  const fields = new WeakMap<Element, Map<string, T | Verdict>>();
  const pending = new Map<string, string>(); // text → request id
  // Requests let finish after their text was edited away (keep's `finish`): answered into the cache, not counted against `limit`.
  const finishing = new Map<string, string>();
  let queue: string[] = [];
  let element: Element | null = null;
  let onAnswer: (error?: { message: string; code?: string }) => void = () => {};

  const known = (el: Element) => fields.get(el) ?? fields.set(el, new Map()).get(el)!;

  function pump(): void {
    while (pending.size < limit && queue.length) {
      const text = queue.shift()!;
      const id = crypto.randomUUID();
      const el = element!;
      pending.set(text, id);
      void ask(text, id).then((answer) => {
        if (pending.get(text) === id) pending.delete(text);
        else if (finishing.get(text) === id) finishing.delete(text);
        else return; // cancelled: the text left the field
        const value = answer.ok ? answer.data : isVerdict(answer.error.code) ? answer.error.code : undefined;
        if (value !== undefined) {
          const cache = known(el);
          cache.set(text, value);
          if (cache.size > CACHE) cache.delete(cache.keys().next().value!);
        }
        pump();
        onAnswer(value === undefined && !answer.ok ? answer.error : undefined);
      });
    }
  }

  function drop(): void {
    for (const id of pending.values()) cancel(id);
    for (const id of finishing.values()) cancel(id);
    pending.clear();
    finishing.clear();
    queue = [];
  }

  /** Requests now belong to `el`; another field's are dropped. */
  function use(el: Element): void {
    if (el !== element) drop();
    element = el;
  }

  return {
    /** What is known of `text` in `el`: its answer, a guard verdict, or nothing yet. */
    get: (el: Element, text: string): T | Verdict | undefined => fields.get(el)?.get(text),
    /** Puts an answer for `text` in `el`'s cache by hand: a re-checked sentence spliced into its paragraph's fix. */
    set: (el: Element, text: string, value: T): void => void known(el).set(text, value),
    /** Something is in flight or queued. */
    busy: (): boolean => pending.size > 0 || queue.length > 0,
    /** Every text known for `el`, oldest first, with its answer. */
    entries: (el: Element): [string, T | Verdict][] => [...(fields.get(el) ?? [])],
    /** Asks every text not known, in flight or queued yet. `then` runs after each answer, with a failed one's error. */
    request(el: Element, texts: string[], then: typeof onAnswer): void {
      use(el);
      onAnswer = then;
      const cache = known(el);
      for (const text of texts) {
        const id = finishing.get(text);
        if (id) {
          // Typed back (undo) while its old request still runs: it counts again.
          finishing.delete(text);
          pending.set(text, id);
        } else if (!cache.has(text) && !pending.has(text) && !queue.includes(text)) queue.push(text);
      }
      pump();
    },
    /**
     * Drops what is queued for texts no longer in `texts` (edited away). In flight, they are
     * cancelled -- or, with `finish`, left to answer into the cache (an earlier version's answer
     * is still worth having) without holding a slot.
     */
    keep(el: Element, texts: string[], finish = false): void {
      use(el);
      for (const [text, id] of pending) {
        if (!texts.includes(text)) {
          if (finish) finishing.set(text, id);
          else cancel(id);
          pending.delete(text);
        }
      }
      queue = queue.filter((text) => texts.includes(text));
      pump();
    },
    drop,
  };
}

export type ChunkRequests<T> = ReturnType<typeof chunkRequests<T>>;
