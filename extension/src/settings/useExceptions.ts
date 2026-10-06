import { useEffect, useState } from 'react';
import { vocabulary, type VocabException } from './vocabulary';

/** The user's exceptions, kept current: the grammar panel marks the words they kept. */
export function useExceptions(): VocabException[] {
  const [exceptions, setExceptions] = useState<VocabException[]>([]);
  useEffect(() => {
    void vocabulary.exceptions().then(setExceptions);
    return vocabulary.watchExceptions(setExceptions);
  }, []);
  return exceptions;
}
