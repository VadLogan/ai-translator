import { expect, it, vi } from 'vitest';
import { requestSlot } from './requestSlot';

it('keeps only the latest request current and cancels on abort', () => {
  const cancel = vi.fn();
  const slot = requestSlot(cancel);
  const first = slot.start('a');
  const second = slot.start('b');
  expect(slot.isCurrent(first)).toBe(false);
  expect(slot.isCurrent(second)).toBe(true);
  expect(slot.text).toBe('b');

  slot.abort();
  expect(cancel).toHaveBeenCalledWith(second);
  expect(slot.text).toBeUndefined();
  slot.abort();
  expect(cancel).toHaveBeenCalledTimes(1);
});

it('done clears the slot without cancelling', () => {
  const cancel = vi.fn();
  const slot = requestSlot(cancel);
  const id = slot.start('a');
  slot.done();
  expect(slot.isCurrent(id)).toBe(false);
  expect(cancel).not.toHaveBeenCalled();
});
