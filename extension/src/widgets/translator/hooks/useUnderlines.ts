import { useEffect, useMemo, useRef, useState } from 'react';
import type { FixEdit, FixKind } from '../../../../../shared/contract';
import { rangeAt, rangeRects, textControlRects, wholeField } from '../../../content/selection';
import { showsUnderlines, visibleEdits, type State } from '../state';

/** An underlined edit and where its text sits on screen, one rect per line. */
export interface Marked {
  edit: FixEdit;
  kind: FixKind;
  rects: DOMRect[];
}

const OPEN_DELAY = 300;
const CLOSE_DELAY = 200;

const sameEdit = (a: FixEdit, b: FixEdit) => a.start === b.start && a.end === b.end;

/**
 * The field's underlines and the hover that opens the grammar panel on one: 300 ms over a mark
 * opens it, 200 ms off both the mark and the card closes it. `relayout` re-measures after a scroll.
 * The handlers are created once and read everything through refs, like the page listeners they feed.
 */
export function useUnderlines(latest: { current: State }, { open, close }: { open: (edit: FixEdit, line: DOMRect) => void; close: () => void }) {
  const state = latest.current;
  const [tick, setTick] = useState(0);
  const marks = useMemo(() => measure(state), [state.selection, state.check, state.ignored, state.screen, tick]);
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const onCard = useRef(false);
  const opening = useRef<{ edit: FixEdit; timer: ReturnType<typeof setTimeout> } | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [handlers] = useState(() => {
    const cancelOpen = () => {
      clearTimeout(opening.current?.timer);
      opening.current = null;
    };
    const cancelClose = () => {
      clearTimeout(closing.current);
      closing.current = undefined;
    };
    return {
      /** The pointer moved; `overWidget` = it is on the widget (the card), not the page. */
      onPointer(x: number, y: number, overWidget: boolean): void {
        const { screen } = latest.current;
        const showing = screen.kind === 'grammar' && screen.hover && screen.fix ? visibleEdits(latest.current, screen.fix)[screen.index] ?? null : null;
        const mark = overWidget ? undefined : marksRef.current.find(({ rects }) => rects.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom + 2));
        const hit = mark?.edit;
        onCard.current = !!showing && (overWidget || (!!hit && sameEdit(hit, showing)));
        if (onCard.current) {
          cancelOpen();
          return cancelClose();
        }
        if (hit) {
          cancelClose();
          if (opening.current && sameEdit(opening.current.edit, hit)) return;
          cancelOpen();
          const timer = setTimeout(() => {
            opening.current = null;
            onCard.current = true; // the pointer is on the mark it opens; a still pointer sends no move to say so
            open(hit, mark!.rects[0]!);
          }, OPEN_DELAY);
          opening.current = { edit: hit, timer };
          return;
        }
        cancelOpen();
        if (!showing || closing.current !== undefined) return;
        closing.current = setTimeout(() => {
          closing.current = undefined;
          close();
        }, CLOSE_DELAY);
      },
      relayout: () => setTick((t) => t + 1),
      /** The card's ↵ only counts while the pointer is on the card or its underline, so an Enter typed in the field stays the field's. */
      isOnCard: () => onCard.current,
    };
  });

  useEffect(() => () => {
    clearTimeout(opening.current?.timer);
    clearTimeout(closing.current);
  }, []);

  return { marks, ...handlers };
}

/** Where each visible edit sits on screen, re-read from the field: nothing when its text moved on from the fix. */
function measure(state: State): Marked[] {
  if (!showsUnderlines(state)) return [];
  const field = wholeField(state.selection!.element);
  if (!field || field.text !== state.check?.text) return [];
  const edits = visibleEdits(state);
  const rects =
    field.kind === 'text-control'
      ? textControlRects(field.element, edits)
      : edits.map(({ start, end }) => {
        const range = rangeAt(field.element, start, end);
        return range ? rangeRects(range, field.element) : [];
      });
  return edits.map((edit, i) => ({ edit, kind: edit.kind, rects: rects[i] ?? [] })).filter(({ rects }) => rects.length > 0);
}
