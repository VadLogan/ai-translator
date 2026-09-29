import type { ReactNode } from 'react';

/** The toolbar popup's frame: fixed width, capped height, one screen inside. */
export function PopupFrame({ children }: { children: ReactNode }) {
  return <div className="flex max-h-[600px] w-[400px] flex-col bg-tm-subtle font-tm text-tm-ink">{children}</div>;
}
