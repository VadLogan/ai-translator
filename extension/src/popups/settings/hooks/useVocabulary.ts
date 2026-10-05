import { useEffect, useState } from 'react';
import { vocabulary, type VocabException, type VocabWord } from '../../../settings/vocabulary';

/** Learning words and exceptions: local to this browser, so read straight from storage. */
export function useVocabulary() {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [exceptions, setExceptions] = useState<VocabException[]>([]);
  useEffect(() => {
    void vocabulary.words().then(setWords);
    void vocabulary.exceptions().then(setExceptions);
    const offWords = vocabulary.watchWords(setWords);
    const offExceptions = vocabulary.watchExceptions(setExceptions);
    return () => {
      offWords();
      offExceptions();
    };
  }, []);
  return {
    words,
    exceptions,
    removeWord: (word: VocabWord) => void vocabulary.removeWord(word),
    addException: (entry: VocabException) => void vocabulary.addException(entry),
    removeException: (term: string) => void vocabulary.removeException(term),
    listen: (word: VocabWord) => {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = word.lang;
      speechSynthesis.speak(utterance);
    },
  };
}
