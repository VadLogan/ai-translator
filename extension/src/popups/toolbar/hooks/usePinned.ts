import { useEffect, useState } from 'react';
import { pinnedLanguages } from '../../../settings/pinned';

/** The pinned languages and their toggle. */
export function usePinned() {
  const [pinned, setPinned] = useState<string[]>([]);
  useEffect(() => void pinnedLanguages.get().then(setPinned), []);
  return { pinned, toggle: (code: string) => void pinnedLanguages.toggle(code).then(setPinned) };
}
