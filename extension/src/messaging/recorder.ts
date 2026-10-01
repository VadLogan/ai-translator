/**
 * Worker ↔ offscreen recorder. `live` hands it the minted Realtime secret (`secret`) and the model
 * that session transcribes with (`model`), sent once the API answers, after `start`. Separate from `Message`: only the worker sends these. `owner` (on
 * `start`): the tab frame that is dictating, echoed on every `VoiceLevel` so the worker can forward
 * it there without remembering anything; absent = the toolbar popup.
 */
export type RecorderMessage = { target: 'offscreen'; type: 'start' | 'stop' | 'cancel' | 'live'; owner?: VoiceOwner; secret?: string; model?: string };

export type VoiceOwner = { tabId: number; frameId: number };

/** On `stop`: `audio`, the recording as a data: url; `seconds`, how long it ran; `text` (and its `model`), the live session's final transcript when it completed. */
export type RecorderReply = { audio?: string; seconds?: number; text?: string; model?: string; error?: 'mic-blocked' | 'mic-failed' };

/**
 * While recording, ~10 times a second: how loud the mic is (0..1), how long it has been
 * recording, the live text heard so far, and `silent` after 3 s without a sound: the UIs then stop
 * the dictation as if Stop was pressed. The popup hears it directly; a tab gets it forwarded by the worker.
 */
export type VoiceLevel = { type: 'voice-level'; level: number; ms: number; text?: string; silent?: boolean; owner?: VoiceOwner };

export const isVoiceLevel = (value: unknown): value is VoiceLevel => (value as VoiceLevel | null)?.type === 'voice-level';
