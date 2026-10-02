import { TRANSCRIBE_MODEL, client } from '../client.ts';
import { DICTATION_PROMPT } from './dictationPrompt.ts';

/** Speech to text only: the recorded audio in, what was said out. */
export async function transcribe(audio: File): Promise<{ text: string; model: string }> {
  const response = await client.audio.transcriptions.create({ file: audio, model: TRANSCRIBE_MODEL, prompt: DICTATION_PROMPT });
  return { text: response.text.trim(), model: TRANSCRIBE_MODEL };
}
