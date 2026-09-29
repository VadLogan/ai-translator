/**
 * One request in flight at a time, e.g. the background check or the clicked fix. `start` hands out
 * the id to send along; an answer whose id is no longer current was cancelled or overtaken and must
 * be dropped. `abort` tells the worker to stop it, so an edited text stops billing.
 */
export function requestSlot(cancel: (id: string) => void) {
  let current: { id: string; text: string } | null = null;
  return {
    /** The text in flight, if any: dedupes asking for it twice. */
    get text(): string | undefined {
      return current?.text;
    },
    start(text: string): string {
      current = { id: crypto.randomUUID(), text };
      return current.id;
    },
    isCurrent: (id: string): boolean => current?.id === id,
    done(): void {
      current = null;
    },
    abort(): void {
      if (!current) return;
      cancel(current.id);
      current = null;
    },
  };
}

export type RequestSlot = ReturnType<typeof requestSlot>;
