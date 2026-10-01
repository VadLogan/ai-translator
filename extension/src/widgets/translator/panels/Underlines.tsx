import type { FixKind } from '../../../../../shared/contract';

/** One underlined edit: a rect per line it spans, in viewport coordinates. */
export interface Mark {
  kind: FixKind;
  rects: readonly { left: number; bottom: number; width: number }[];
}

/** A 2px bar under each marked run of the field's text: red for an error, blue for a more native wording. Never takes the pointer. */
export function Underlines({ marks }: { marks: readonly Mark[] }) {
  return (
    <>
      {marks.flatMap(({ kind, rects }, i) =>
        rects.map((r, j) => (
          <div
            key={`${i}-${j}`}
            aria-hidden
            className={`pointer-events-none fixed h-0.5 rounded-full ${kind === 'native' ? 'bg-tm-accent' : 'bg-tm-danger-ink'}`}
            style={{ left: r.left, top: r.bottom - 1, width: r.width }}
          />
        )),
      )}
    </>
  );
}
