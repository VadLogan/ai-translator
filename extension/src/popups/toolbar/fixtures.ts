import type { HistoryEntry } from '../../settings/history';
import type { MeetingRecord } from '../../settings/meetings';

/** Storybook data for the popup screens. */

const now = Date.now();
const at = (daysAgo: number, hour: number, minute: number) => {
  const date = new Date(now - daysAgo * 86_400_000);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
};

export const noop = () => undefined;

export const HISTORY: HistoryEntry[] = [
  { text: 'Cześć, przesyłam wycenę na prace wykończeniowe…', result: "Hi, I'm sending over the quote for the finishing works.", from: 'pl', to: 'en', site: 'mail.google.com', at: at(0, 10, 24), starred: true },
  { kind: 'grammar', text: 'I has sent the invoice yesterday, pls check.', result: 'I sent the invoice yesterday, please check.', site: 'mail.google.com', at: at(0, 10, 2), voice: true },
  { text: 'Підтверджую доставку плитки на четвер…', result: 'Confirming the tile delivery for Thursday.', from: 'uk', to: 'en', site: 'web.whatsapp.com', at: at(0, 9, 41), voice: true },
  { text: 'Could you split the estimate room by room?', result: 'Czy możesz rozbić kosztorys na pomieszczenia?', from: 'en', to: 'pl', site: 'app.slack.com', at: at(1, 18, 7) },
  { text: 'Dziękuję, termin pasuje.', result: 'Thank you, the date works.', from: 'pl', to: 'en', site: 'mail.google.com', at: at(1, 12, 5) },
];

export const LATELY = [{ code: 'de', at: now - 2 * 86_400_000 }, { code: 'fr', at: now - 8 * 86_400_000 }];

export const MEETINGS: MeetingRecord[] = [
  {
    at: at(0, 12, 21),
    site: 'meet.example.com',
    seconds: 37 * 60,
    speakers: 2,
    last: 'Speaker 1: Let’s touch base on Friday and decide.',
    cast: [
      { id: 's1', name: 'Speaker 1', color: '#7C3AED' },
      { id: 's2', name: 'Speaker 2', color: '#0E7A3F' },
      { id: 'me', name: 'You', color: '#46699D', me: true },
    ],
    lines: [
      { speaker: 's1', t: 4, text: 'Okay, let’s kick off. Did everyone see the new booking numbers?' },
      { speaker: 'me', t: 9, text: 'Yes, I has send them to the team yesterday.', errors: 1 },
      { speaker: 's2', t: 15, text: 'Conversion in Spain looks lower than last month, it is a bit of a red flag.' },
      { speaker: 'me', t: 22, text: 'I think it depend on the new payment page, we should check it.', errors: 2 },
      { speaker: 'me', t: 30, text: 'Sure, I will send a short summary.', errors: 0 },
      { speaker: 's1', t: 2214, text: 'Let’s touch base on Friday and decide.' },
    ],
  },
  { at: at(1, 9, 30), site: 'teams.example.com', seconds: 52 * 60, speakers: 4, last: 'You: I will send the drawings until evening.' },
  { at: at(1, 16, 5), site: 'meet.example.com', seconds: 18 * 60, speakers: 1, last: 'Speaker 1: Perfect, see you on site.' },
];

export const MEETINGS_TAB = { meetings: MEETINGS, startHost: 'meet.example.com', onStart: noop, onCopyNote: noop, onClearAll: noop, onOpen: noop, notice: null, undo: null };
