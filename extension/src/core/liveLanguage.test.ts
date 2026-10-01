import { expect, it, vi } from 'vitest';
import { liveLanguage } from './liveLanguage';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

it('asks once the live text has 4 words, one request at a time, and keeps the answer', async () => {
  const ask = vi.fn(async () => 'de');
  const live = liveLanguage(ask);
  live.feed('Ich schicke dir');
  expect(ask).not.toHaveBeenCalled();
  live.feed('Ich schicke dir morgen');
  live.feed('Ich schicke dir morgen den'); // the first is still in flight
  expect(ask).toHaveBeenCalledTimes(1);
  await flush();
  expect(live.lang).toBe('de');
  live.feed('Ich schicke dir morgen den Bericht');
  expect(ask).toHaveBeenCalledTimes(1);
});

it('asks again after "und" or a failure, and starts over on reset', async () => {
  const ask = vi.fn<(text: string) => Promise<string | undefined>>().mockResolvedValueOnce('und').mockRejectedValueOnce(new Error('422')).mockResolvedValue('en');
  const live = liveLanguage(ask);
  for (const text of ['a b c d', 'a b c d e', 'a b c d e f']) {
    live.feed(text);
    await flush();
  }
  expect(ask).toHaveBeenCalledTimes(3);
  expect(live.lang).toBe('en');
  live.reset();
  expect(live.lang).toBeUndefined();
});
