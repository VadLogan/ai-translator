import { expect, it, vi } from 'vitest';
import type { FixGrammarOk } from '../../../shared/contract';
import type { Response } from '../messaging/messages';
import { sentenceFixes, sentences } from './sentenceFixes';

/** A fake /fix-grammar: "has send" → "sent", "was" → "were". */
function fake(text: string): Response<FixGrammarOk> {
  const edits: FixGrammarOk['edits'] = [];
  let fixed = text;
  for (const [original, replacement] of [['has send', 'sent'], ['was', 'were']] as const) {
    const start = text.indexOf(original);
    if (start >= 0) {
      edits.push({ start, end: start + original.length, original, replacement, kind: 'error', reason: '' });
      fixed = fixed.replace(original, replacement);
    }
  }
  return { ok: true, data: { text: fixed, html: fixed, edits } };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

it('splits a text into trimmed sentences with their offsets', () => {
  expect(sentences(' I has send it.  They was happy')).toEqual([
    { start: 1, text: 'I has send it.' },
    { start: 17, text: 'They was happy' },
  ]);
});

it('fixes each ended sentence while it is spoken, and only the rest at Stop', async () => {
  const ask = vi.fn(async (text: string) => fake(text));
  const fixer = sentenceFixes(ask, vi.fn());
  fixer.feed('I has send the report.');
  fixer.feed('I has send the report. They was'); // the second sentence hasn't ended
  await flush();
  expect(ask.mock.calls.map(([text]) => text)).toEqual(['I has send the report.']);

  const final = 'I has send the report. They was happy.';
  const answer = await fixer.finish(final);
  expect(ask.mock.calls.map(([text]) => text)).toEqual(['I has send the report.', 'They was happy.']);
  expect(answer.ok && answer.data.text).toBe('I sent the report. They were happy.');
  // Edits in the whole text's offsets, as one /fix-grammar of it would give.
  expect(answer.ok && answer.data.edits.map((e) => final.slice(e.start, e.end))).toEqual(['has send', 'was']);
});

it('asks again a sentence the final transcript worded differently', async () => {
  const ask = vi.fn(async (text: string) => fake(text));
  const fixer = sentenceFixes(ask, vi.fn());
  fixer.feed('I has sent it.');
  await fixer.finish('I has send it.');
  expect(ask.mock.calls.map(([text]) => text)).toEqual(['I has sent it.', 'I has send it.']);
});

it('keeps at most 2 fixes in flight while speaking', () => {
  const ask = vi.fn(() => new Promise<Response<FixGrammarOk>>(() => {}));
  sentenceFixes(ask, vi.fn()).feed('One two. Three four. Five six. Seven.');
  expect(ask).toHaveBeenCalledTimes(2);
});

it('takes a guard verdict as clean, and fails on any other error', async () => {
  const verdict = sentenceFixes(async (text) => (text.startsWith('xq') ? { ok: false, error: { message: 'no', code: 'gibberish' } } : fake(text)), vi.fn());
  const answer = await verdict.finish('xqzt vbn. They was here.');
  expect(answer.ok && answer.data.text).toBe('xqzt vbn. They were here.');

  const failing = sentenceFixes(async () => ({ ok: false, error: { message: 'Sign in', code: 'unauthenticated' } }), vi.fn());
  expect(await failing.finish('Hi there.')).toMatchObject({ ok: false, error: { code: 'unauthenticated' } });
});

it('cancels what is in flight on reset', () => {
  const cancel = vi.fn();
  const fixer = sentenceFixes(() => new Promise(() => {}), cancel);
  fixer.feed('One two three.');
  fixer.reset();
  expect(cancel).toHaveBeenCalledTimes(1);
});


it('reports the sentences fixed so far while others are pending', async () => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  const ask = vi.fn(async (text: string) => (text.startsWith('They') ? held.then(() => fake(text)) : fake(text)));
  const progress = vi.fn();
  const answer = sentenceFixes(ask, vi.fn()).finish('I has send it. They was happy.', progress);
  await flush();
  expect(progress).toHaveBeenCalledTimes(1);
  expect(progress.mock.calls[0]![0].text).toBe('I sent it. They was happy.');
  release();
  expect((await answer).ok && (await answer as { data: FixGrammarOk }).data.text).toBe('I sent it. They were happy.');
  expect(progress).toHaveBeenCalledTimes(1); // the last answer is finish's own
});
