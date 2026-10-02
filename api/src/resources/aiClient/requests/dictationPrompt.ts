/**
 * What both transcription calls are told about the audio (the upload in transcribe.ts, the live
 * session in voiceSession.ts). Without it, a short greeting is guessed from nearly nothing: on
 * "hey John" the models answered "ChatGPT", "Agent", "pageant", "平仮名" -- 1 right in 6 runs.
 * With it, 6 in 6. It steers spelling and context only; the words stay the speaker's.
 */
export const DICTATION_PROMPT =
  "The speaker is dictating a chat message or email to other people, often starting with a greeting and a person's name (Hey John, Hi Anna). Transcribe names exactly as spoken. The speaker is not talking to an AI assistant.";
