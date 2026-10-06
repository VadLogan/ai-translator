import type { TranscriptDeps } from '../core/transcript';
import { storageSettings } from '../settings/storage-settings';
import { vocabulary } from '../settings/vocabulary';
import { sendMessage } from './messages';

const id = () => crypto.randomUUID();

/**
 * The worker messages and storage behind a meeting transcript's actions, for `transcriptActions`.
 * Shared by the live meeting card (content script) and the popup's meeting detail.
 * `source` is the vocabulary entry's "where it was met" ("Meeting · meet.example.com").
 */
export function transcriptSenders(source: string): Omit<TranscriptDeps, 'dispatch'> {
  return {
    translate: (text, targetLang) => sendMessage({ type: 'translate', text, targetLang }),
    explain: (text, context, targetLang) => sendMessage({ type: 'explain', text, context, targetLang }),
    check: (text) => sendMessage({ type: 'check', text, id: id() }),
    // The line's own /check answered first, so the API can skip the guard.
    fix: (text) => sendMessage({ type: 'fix-grammar', text, id: id(), guarded: true }),
    addWord: (word) => vocabulary.addWord({ ...word, hit: word.word, at: Date.now(), source }),
    removeWord: (word, lang) => vocabulary.removeWord({ word, lang } as Parameters<typeof vocabulary.removeWord>[0]),
    // ponytail: the first favorite is "the user's language"; a meeting in that same language gets
    // translations into itself. Pick the first favorite unlike the line's language if that bites.
    targetLang: async () => (await storageSettings.get()).favoriteLanguages[0] ?? 'en',
  };
}
