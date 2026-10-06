import { ME, SPEAKER_COLORS } from '../state';

/*
 * ponytail: a scripted conversation stands in for the meeting audio pipeline (tab audio + mic,
 * speakers). Only the transcript is scripted; every action on it calls the real API.
 */

export const DEMO_SPEAKERS = [
  { id: 's1', name: 'Speaker 1', color: SPEAKER_COLORS[0] },
  { id: 's2', name: 'Speaker 2', color: SPEAKER_COLORS[1] },
  { id: ME, name: 'You', color: SPEAKER_COLORS[2] },
];

export const DEMO_SCRIPT: { speaker: string; text: string }[] = [
  { speaker: 's1', text: "Okay, let's kick off. Did everyone see the new booking numbers?" },
  { speaker: ME, text: 'Yes, I has send them to the team yesterday.' },
  { speaker: 's2', text: 'Thanks. Conversion in Spain looks lower than last month, it is a bit of a red flag.' },
  { speaker: ME, text: 'I think it depend on the new payment page, we should check it.' },
  { speaker: 's1', text: "Good point. Let's touch base on Friday and decide. Can you put together a short summary?" },
  { speaker: ME, text: 'Sure, I will send it until Wednesday evening.' },
  { speaker: 's2', text: "I'll ask them whether they can share the raw data too, just to be on the safe side." },
];

/** Milliseconds per spoken word, and words of silence between lines. */
export const WORD_MS = 280;
export const PAUSE_WORDS = 4;
