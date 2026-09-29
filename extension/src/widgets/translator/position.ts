import type { CSSProperties } from 'react';
import type { Anchor } from '../../content/selection';

/** Where the widget sits on screen, relative to the selection or field it belongs to. Pure: the viewport is passed in. */

export const ICON_SIZE = 26;
const GAP = 6;
const VIEWPORT_MARGIN = 8;

export type Size = { width: number; height: number };

export const viewportSize = (): Size => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight });

/** Centered above the selection; below it when there is no room above. */
export function iconStyle(anchor: Anchor, viewport: Size): CSSProperties {
  let top = anchor.top - ICON_SIZE - GAP;
  if (top < VIEWPORT_MARGIN) top = anchor.bottom + GAP; // no room above: drop below the selection
  return {
    left: clamp(anchor.x - ICON_SIZE / 2, VIEWPORT_MARGIN, viewport.width - ICON_SIZE - VIEWPORT_MARGIN),
    top: clamp(top, VIEWPORT_MARGIN, viewport.height - ICON_SIZE - VIEWPORT_MARGIN),
  };
}

/** Inside the field's bottom-right corner, clear of its border. */
export function cornerStyle(anchor: Anchor): CSSProperties {
  return { left: anchor.x - ICON_SIZE - GAP, top: anchor.bottom - ICON_SIZE - GAP };
}

/** The panel below the selection, flipped above it when it would run off the bottom; kept inside the viewport. */
export function panelPosition(anchor: Anchor, panel: Size, viewport: Size): { left: number; top: number } {
  let top = anchor.bottom + GAP;
  if (top + panel.height > viewport.height - VIEWPORT_MARGIN) top = anchor.top - panel.height - GAP;
  return {
    left: clamp(anchor.x + GAP, VIEWPORT_MARGIN, viewport.width - panel.width - VIEWPORT_MARGIN),
    top: clamp(top, VIEWPORT_MARGIN, viewport.height - panel.height - VIEWPORT_MARGIN),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
