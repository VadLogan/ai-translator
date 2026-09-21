import { describe, expect, it } from 'vitest';
import { switchLayout } from './layout';

describe('switchLayout', () => {
  it('reads Latin keys typed on a Cyrillic layout', () => {
    expect(switchLayout('ghbdtn')).toBe('привет');
  });

  it('reads Cyrillic keys typed on a Latin layout', () => {
    expect(switchLayout('ерші')).toBe('this');
  });

  it('keeps case and passes untyped characters through', () => {
    expect(switchLayout('Ghbdtn!')).toBe('Привет!');
  });

  it('maps the Russian-only keys back to Latin', () => {
    expect(switchLayout('ы')).toBe('s');
  });
});
