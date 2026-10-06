import { describe, expect, it } from 'vitest';
import { initialMeeting, meetingReducer } from './state';
import { toView } from './view';

describe('toView', () => {
  const speakers = [
    { id: 's1', name: 'Speaker 1', color: '#7C3AED' },
    { id: 'me', name: 'You', color: '#46699D' },
  ];
  const base = [
    { type: 'line' as const, line: { id: 'l1', speaker: 's1', t: 5, text: 'Touch base?' } },
    { type: 'line' as const, line: { id: 'l2', speaker: 'me', t: 65, text: 'I has send it' } },
  ].reduce(meetingReducer, initialMeeting(speakers));

  it("names, colours and times each line; only the user's lines carry a check", () => {
    const checked = meetingReducer(base, { type: 'transcript', action: { type: 'check-done', line: 'l2', errors: 2 } });
    const [other, mine] = toView(checked).lines;
    expect(other).toMatchObject({ name: 'Speaker 1', color: '#7C3AED', t: '0:05', me: false, check: null });
    expect(mine).toMatchObject({ name: 'You', t: '1:05', me: true, check: { kind: 'errors', count: 2, open: false } });
  });

  it('hides the live line unless listening', () => {
    const live = meetingReducer(base, { type: 'live', live: { speaker: 'me', text: 'So' } });
    expect(toView(live).live).toEqual({ name: 'You', color: '#46699D', text: 'So' });
    expect(toView({ ...live, status: 'paused' }).live).toBeNull();
  });

  it('formats the meeting clock', () => {
    expect(toView({ ...base, elapsed: 872 }).elapsed).toBe('14:32');
  });
});
