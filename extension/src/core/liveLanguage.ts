/** Enough words for a language guess; fewer and the live text is asked again as it grows. */
const MIN_WORDS = 4;

/**
 * The language of a dictation, asked while the user still speaks, so Stop can open the grammar
 * panel or the translation at once instead of waiting on a detection. `feed` takes each live text:
 * the first one with MIN_WORDS words is asked, one request at a time, until one answers with a
 * language ("und" or a failure: the next text asks again). One answer is kept for the recording.
 */
export function liveLanguage(ask: (text: string) => Promise<string | undefined>) {
  let lang: string | undefined;
  let busy = false;
  return {
    feed(text: string | undefined): void {
      if (lang || busy || !text || text.trim().split(/\s+/).length < MIN_WORDS) return;
      busy = true;
      void ask(text)
        .then((answer) => {
          if (answer && answer !== 'und') lang = answer;
        }, () => undefined)
        .finally(() => (busy = false));
    },
    get lang(): string | undefined {
      return lang;
    },
    reset(): void {
      lang = undefined;
      busy = false;
    },
  };
}
