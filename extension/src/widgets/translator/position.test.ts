import { expect, it } from 'vitest';
import { cornerStyle, iconStyle, panelPosition } from './position';

const viewport = { width: 1000, height: 800 };

it('puts the icon above the selection, or below it at the top edge', () => {
  expect(iconStyle({ x: 500, top: 300, bottom: 320 }, viewport)).toEqual({ left: 487, top: 268 });
  expect(iconStyle({ x: 500, top: 10, bottom: 30 }, viewport)).toEqual({ left: 487, top: 36 });
});

it('keeps the icon inside the viewport', () => {
  expect(iconStyle({ x: 2, top: 300, bottom: 320 }, viewport).left).toBe(8);
  expect(iconStyle({ x: 999, top: 300, bottom: 320 }, viewport).left).toBe(966);
});

it('puts the corner icon inside the field', () => {
  expect(cornerStyle({ x: 400, top: 100, bottom: 200 })).toEqual({ left: 368, top: 168 });
});

it('opens the panel below the selection and flips it above near the bottom', () => {
  const panel = { width: 280, height: 200 };
  expect(panelPosition({ x: 100, top: 100, bottom: 120 }, panel, viewport)).toEqual({ left: 106, top: 126 });
  expect(panelPosition({ x: 100, top: 700, bottom: 720 }, panel, viewport)).toEqual({ left: 106, top: 494 });
});

it('keeps the panel inside the viewport', () => {
  expect(panelPosition({ x: 900, top: 100, bottom: 120 }, { width: 280, height: 200 }, viewport).left).toBe(712);
  expect(panelPosition({ x: 100, top: 100, bottom: 120 }, { width: 280, height: 900 }, viewport).top).toBe(8);
});
