import type { FixGrammarOk } from '../../../shared/contract';
import type { Response } from '../messaging/messages';
import { cleanFix, isFinished, mergeFixes, type Chunk } from './fixEdits';

const LIMIT = 2; // fixes in flight while the user speaks

type Ask = (text: string, id: string) => Promise<Response<FixGrammarOk>>;

/** `text`'s sentences, trimmed, with their offsets. */
export function sentences(text: string): Chunk[] {
  return [...new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(text)].flatMap(({ segment, index }) => {
    const trimmed = segment.trim();
    return trimmed ? [{ start: index + segment.indexOf(trimmed), text: trimmed }] : [];
  });
}

/**
 * A dictation's grammar fix, made while it is spoken: `feed` takes each live text and fixes every
 * sentence that has ended (one /fix-grammar each, LIMIT at a time, each text once). At Stop,
 * `finish` takes the final transcript: the sentences already fixed are reused, the rest (the last
 * one, or one the final transcript worded differently) asked now, and the answers merged into one
 * fix of the whole text -- as if it had been asked in one piece, only most of it is done already.
 * (The live text's unended last sentence is not asked early: it lags the speech, so the final
 * transcript nearly always words it differently -- measured, it only added a wasted request.)
 * A sentence the guard rejects (a verdict) counts as clean; any other failure fails `finish`.
 */
export function sentenceFixes(ask: Ask, cancel: (id: string) => void) {
  let asked = new Map<string, { id: string; answer: Promise<Response<FixGrammarOk>> }>();
  let inFlight = 0;

  const fixOf = (text: string) => {
    const known = asked.get(text);
    if (known) return known.answer;
    const id = crypto.randomUUID();
    inFlight++;
    const answer = ask(text, id).then((response) => {
      inFlight--;
      if (!response.ok && asked.get(text)?.id === id) asked.delete(text); // a failure is asked again
      return response;
    });
    asked.set(text, { id, answer });
    return answer;
  };

  return {
    feed(text: string | undefined): void {
      for (const sentence of sentences(text ?? '')) {
        if (inFlight >= LIMIT) return;
        if (isFinished(sentence.text) && !asked.has(sentence.text)) void fixOf(sentence.text);
      }
    },

    async finish(text: string): Promise<Response<FixGrammarOk>> {
      const parts = sentences(text);
      const answers = await Promise.all(parts.map((part) => fixOf(part.text)));
      const failed = answers.find((answer) => !answer.ok && answer.error.code !== 'mistyped' && answer.error.code !== 'gibberish');
      if (failed && !failed.ok) return failed;
      const fixes = parts.map((chunk, i) => {
        const answer = answers[i]!;
        return { chunk, fix: answer.ok ? answer.data : cleanFix(chunk.text) };
      });
      return { ok: true, data: mergeFixes(text, fixes) };
    },

    /** A new dictation: what is in flight is cancelled, nothing is reused. */
    reset(): void {
      for (const { id } of asked.values()) cancel(id);
      asked = new Map();
      inFlight = 0;
    },
  };
}
