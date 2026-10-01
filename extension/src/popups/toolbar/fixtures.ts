import type { HistoryEntry } from '../../settings/history';

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
  { kind: 'grammar', text: 'I has sent the invoice yesterday, pls check.', result: 'I sent the invoice yesterday, please check.', site: 'mail.google.com', at: at(0, 10, 2) },
  { text: 'Підтверджую доставку плитки на четвер…', result: 'Confirming the tile delivery for Thursday.', from: 'uk', to: 'en', site: 'web.whatsapp.com', at: at(0, 9, 41) },
  { text: 'Could you split the estimate room by room?', result: 'Czy możesz rozbić kosztorys na pomieszczenia?', from: 'en', to: 'pl', site: 'app.slack.com', at: at(1, 18, 7) },
  { text: 'Dziękuję, termin pasuje.', result: 'Thank you, the date works.', from: 'pl', to: 'en', site: 'mail.google.com', at: at(1, 12, 5) },
];

export const LATELY = [{ code: 'de', at: now - 2 * 86_400_000 }, { code: 'fr', at: now - 8 * 86_400_000 }];
