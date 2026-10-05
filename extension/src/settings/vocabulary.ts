import { storage } from 'wxt/utils/storage';

/** A word or phrase the user is learning, with where they met it. */
export interface VocabWord {
  word: string;
  /** The word's language code. */
  lang: string;
  meaning: string;
  /** When it was added, ms. */
  at: number;
  /** "Meeting · meet.example.com". */
  source: string;
  /** The sentence it was met in; `hit` is the part of it to highlight. */
  context: string;
  hit?: string;
  examples: string[];
}

export const EXCEPTION_KINDS = ['Brand', 'Name', 'Term', 'Code'] as const;

/** A name, brand or term kept exactly as written; `replaces` are wrong forms rewritten to it. */
export interface VocabException {
  term: string;
  kind: (typeof EXCEPTION_KINDS)[number];
  replaces: string[];
}

// Local to this browser for now, like disabled fields: not part of the synced Settings.
const words = storage.defineItem<VocabWord[]>('local:vocabularyWords', { fallback: [] });
const exceptions = storage.defineItem<VocabException[]>('local:vocabularyExceptions', { fallback: [] });

export const vocabulary = {
  words: () => words.getValue(),
  exceptions: () => exceptions.getValue(),
  async removeWord(word: VocabWord): Promise<void> {
    await words.setValue((await words.getValue()).filter((w) => !(w.word === word.word && w.lang === word.lang)));
  },
  async addException(entry: VocabException): Promise<void> {
    const list = (await exceptions.getValue()).filter((x) => x.term !== entry.term);
    await exceptions.setValue([...list, entry]);
  },
  async removeException(term: string): Promise<void> {
    await exceptions.setValue((await exceptions.getValue()).filter((x) => x.term !== term));
  },
  watchWords: (callback: (list: VocabWord[]) => void) => words.watch((list) => callback(list ?? [])),
  watchExceptions: (callback: (list: VocabException[]) => void) => exceptions.watch((list) => callback(list ?? [])),
};
