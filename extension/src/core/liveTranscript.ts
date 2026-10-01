/**
 * A live transcription session's text, built from the Realtime API's server events. Items show in
 * the order they first appear (with no turn detection the deltas come before the item's
 * `committed`); an item's `completed` transcript replaces its deltas.
 */
export interface LiveTranscript {
  order: string[];
  text: Record<string, string>;
  done: string[];
  failed: boolean;
}

export const emptyTranscript = (): LiveTranscript => ({ order: [], text: {}, done: [], failed: false });

type ServerEvent = { type: string; item_id?: string; delta?: string; transcript?: string };

export function applyEvent(state: LiveTranscript, event: ServerEvent): LiveTranscript {
  const id = event.item_id;
  const seen = (s: LiveTranscript) => (id && !s.order.includes(id) ? { ...s, order: [...s.order, id] } : s);
  switch (event.type) {
    case 'input_audio_buffer.committed':
      return seen(state);
    case 'conversation.item.input_audio_transcription.delta': {
      if (!id) return state;
      const next = seen(state);
      return { ...next, text: { ...next.text, [id]: (next.text[id] ?? '') + (event.delta ?? '') } };
    }
    case 'conversation.item.input_audio_transcription.completed': {
      if (!id) return state;
      const next = seen(state);
      return { ...next, text: { ...next.text, [id]: event.transcript ?? next.text[id] ?? '' }, done: [...next.done, id] };
    }
    case 'conversation.item.input_audio_transcription.failed':
    case 'error':
      return { ...state, failed: true };
    default:
      return state;
  }
}

/** Everything heard so far, item after item. */
export const liveText = (state: LiveTranscript): string =>
  state.order.map((id) => state.text[id]?.trim() ?? '').filter(Boolean).join(' ');

/** Every item heard has its final transcript: the text is the session's answer. */
export const isComplete = (state: LiveTranscript): boolean =>
  !state.failed && state.order.length > 0 && state.order.every((id) => state.done.includes(id));
