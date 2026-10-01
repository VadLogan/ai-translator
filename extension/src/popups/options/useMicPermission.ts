import { useEffect, useState } from 'react';

export type MicState = 'granted' | 'prompt' | 'denied';

/**
 * The extension's microphone permission. Voice input records in an offscreen document, which can't
 * show Chrome's prompt, so it is asked here, once, for the whole extension. `requested`: opened as
 * `options.html#mic` by a dictation the permission blocked, so the section is picked out.
 */
export function useMicPermission() {
  const [state, setState] = useState<MicState>('prompt');
  useEffect(() => {
    let status: PermissionStatus | undefined;
    const sync = () => status && setState(status.state);
    void navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
      status = result;
      sync();
      result.addEventListener('change', sync);
    });
    // The page renders after load, so the browser's own jump to #mic found nothing yet.
    if (location.hash === '#mic') document.getElementById('mic')?.scrollIntoView();
    return () => status?.removeEventListener('change', sync);
  }, []);

  const allow = async () => {
    try {
      // Only for the prompt: the stream is closed at once.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setState('granted');
    } catch {
      setState('denied');
    }
  };

  return { state, allow, requested: location.hash === '#mic' };
}
