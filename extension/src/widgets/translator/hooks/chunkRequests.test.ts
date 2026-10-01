import { expect, it, vi } from 'vitest';
import type { FixGrammarOk } from '../../../../../shared/contract';
import type { Response } from '../../../messaging/messages';
import { chunkRequests } from './chunkRequests';

const fix = (text: string): FixGrammarOk => ({ text, html: text, edits: [] });

/** An `ask` whose answers the test releases by hand. */
function asker() {
  const calls: { text: string; id: string; answer: (r: Response<FixGrammarOk>) => void }[] = [];
  const ask = vi.fn((text: string, id: string) => new Promise<Response<FixGrammarOk>>((answer) => calls.push({ text, id, answer })));
  return { ask, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

it('asks at most two chunks at a time, then the queued ones', async () => {
  const { ask, calls } = asker();
  const fixes = chunkRequests(ask, vi.fn());
  const el = {} as Element;
  const then = vi.fn();
  fixes.request(el, ['a', 'b', 'c'], then);
  expect(calls.map((c) => c.text)).toEqual(['a', 'b']);

  calls[0]!.answer({ ok: true, data: fix('A') });
  await tick();
  expect(calls.map((c) => c.text)).toEqual(['a', 'b', 'c']);
  expect(fixes.get(el, 'a')).toEqual(fix('A'));
  expect(then).toHaveBeenCalledWith(undefined);
  expect(fixes.busy()).toBe(true);
});

it('asks a known text never again, and keep cancels one that left the field', async () => {
  const { ask, calls } = asker();
  const cancel = vi.fn();
  const fixes = chunkRequests(ask, cancel);
  const el = {} as Element;
  fixes.request(el, ['a', 'b'], vi.fn());
  calls[0]!.answer({ ok: true, data: fix('A') });
  await tick();

  fixes.keep(el, ['a', 'b2']); // b was edited into b2
  fixes.request(el, ['a', 'b2'], vi.fn());
  expect(cancel).toHaveBeenCalledWith(calls[1]!.id);
  expect(calls.map((c) => c.text)).toEqual(['a', 'b', 'b2']);

  calls[1]!.answer({ ok: true, data: fix('B') }); // the cancelled answer arrives anyway
  await tick();
  expect(fixes.get(el, 'b')).toBeUndefined();
});

it('remembers a verdict, not a failure', async () => {
  const { ask, calls } = asker();
  const fixes = chunkRequests(ask, vi.fn());
  const el = {} as Element;
  const then = vi.fn();
  fixes.request(el, ['ghbdtn', 'x'], then);
  calls[0]!.answer({ ok: false, error: { message: 'layout', code: 'mistyped' } });
  calls[1]!.answer({ ok: false, error: { message: 'down', code: 'provider-failed' } });
  await tick();

  expect(fixes.get(el, 'ghbdtn')).toBe('mistyped');
  expect(fixes.get(el, 'x')).toBeUndefined();
  expect(then).toHaveBeenLastCalledWith({ message: 'down', code: 'provider-failed' });
  expect(fixes.busy()).toBe(false);
});

it('with finish, lets an edited-away request answer into the cache without holding a slot', async () => {
  const { ask, calls } = asker();
  const cancel = vi.fn();
  const fixes = chunkRequests(ask, cancel);
  const el = {} as Element;
  fixes.request(el, ['a', 'b'], vi.fn());
  fixes.keep(el, ['a2', 'b'], true); // a was edited into a2
  fixes.request(el, ['a2', 'b'], vi.fn());
  expect(cancel).not.toHaveBeenCalled();
  expect(calls.map((c) => c.text)).toEqual(['a', 'b', 'a2']); // a's slot went to a2

  calls[0]!.answer({ ok: true, data: fix('A') });
  await tick();
  expect(fixes.get(el, 'a')).toEqual(fix('A'));
  expect(fixes.entries(el).map(([text]) => text)).toEqual(['a']);
});

it('picks a finishing request back up when its text is typed back', () => {
  const { ask, calls } = asker();
  const fixes = chunkRequests(ask, vi.fn());
  const el = {} as Element;
  fixes.request(el, ['a'], vi.fn());
  fixes.keep(el, ['a2'], true);
  fixes.keep(el, ['a'], true); // undo
  fixes.request(el, ['a'], vi.fn());
  expect(calls.map((c) => c.text)).toEqual(['a']);
  expect(fixes.busy()).toBe(true);
});
