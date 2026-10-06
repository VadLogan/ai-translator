import { describe, expect, it } from 'vitest';
import { durationLabel, MEETINGS_LIMIT, speakersLabel, transcriptText, whenLabel, withMeeting, type MeetingRecord } from './meetings';

const record = (at: number): MeetingRecord => ({ at, site: 'meet.example.com', seconds: 60, speakers: 1, last: 'You: hi' });

describe('meetings', () => {
  it('labels speakers and length', () => {
    expect(speakersLabel(1)).toBe('1 speaker and you');
    expect(speakersLabel(4)).toBe('4 speakers and you');
    expect(speakersLabel(0)).toBe('0 speakers and you');
    expect(durationLabel(37 * 60 + 10)).toBe('37 min');
    expect(durationLabel(5)).toBe('1 min');
  });

  it('keeps the newest first, replaces the same id and caps the list', () => {
    expect(withMeeting([record(1)], record(2)).map((m) => m.at)).toEqual([2, 1]);
    expect(withMeeting([record(2), record(1)], { ...record(1), seconds: 9 })).toEqual([{ ...record(1), seconds: 9 }, record(2)]);
    const full = Array.from({ length: MEETINGS_LIMIT }, (_, i) => record(i));
    expect(withMeeting(full, record(999))).toHaveLength(MEETINGS_LIMIT);
  });

  it('copies the transcript one line per spoken line; none saved = empty', () => {
    const r: MeetingRecord = {
      ...record(1),
      cast: [{ id: 's1', name: 'Anna', color: '' }, { id: 'me', name: 'You', color: '', me: true }],
      lines: [{ speaker: 's1', t: 5, text: 'Friday?' }, { speaker: 'me', t: 65, text: 'Yes.' }],
    };
    expect(transcriptText(r)).toBe('Anna (0:05): Friday?\nYou (1:05): Yes.');
    expect(transcriptText(record(1))).toBe('');
  });

  it('reads the start and length as the detail subtitle', () => {
    const at = new Date(2026, 9, 6, 12, 21).getTime();
    expect(whenLabel({ ...record(at), seconds: 37 * 60 }, at + 3_600_000)).toBe('Today 12:21 · 37 min');
  });
});
