import { describe, expect, it } from 'vitest';
import { initialMeeting, meetingRecord, meetingReducer, type MeetingState } from './state';

const start = () => initialMeeting([{ id: 's1', name: 'Speaker 1', color: '#7C3AED' }]);
const line = { id: 'l1', speaker: 's1', t: 3, text: 'Hello' };
const run = (state: MeetingState, ...actions: Parameters<typeof meetingReducer>[1][]) => actions.reduce(meetingReducer, state);

describe('meetingReducer', () => {
  it('ticks only while listening', () => {
    expect(run(start(), { type: 'tick' }, { type: 'tick' }).elapsed).toBe(2);
    expect(run(start(), { type: 'toggle-pause' }, { type: 'tick' }).elapsed).toBe(0);
    expect(run(start(), { type: 'end' }, { type: 'tick' }).elapsed).toBe(0);
  });

  it('a committed line clears the live one', () => {
    const s = run(start(), { type: 'live', live: { speaker: 's1', text: 'Hel' } }, { type: 'line', line });
    expect(s.lines).toEqual([line]);
    expect(s.live).toBeNull();
  });

  it('takes no live text while paused, and no lines once ended', () => {
    expect(run(start(), { type: 'toggle-pause' }, { type: 'live', live: { speaker: 's1', text: 'x' } }).live).toBeNull();
    expect(run(start(), { type: 'end' }, { type: 'line', line }).lines).toEqual([]);
    expect(run(start(), { type: 'end' }, { type: 'toggle-pause' }).status).toBe('ended');
  });



  it('renames a speaker, ignoring a blank name', () => {
    expect(run(start(), { type: 'rename-start', id: 's1' }, { type: 'rename', id: 's1', name: ' Anna ' }).speakers[0]!.name).toBe('Anna');
    const blank = run(start(), { type: 'rename-start', id: 's1' }, { type: 'rename', id: 's1', name: '  ' });
    expect(blank.speakers[0]!.name).toBe('Speaker 1');
    expect(blank.renaming).toBeNull();
  });
});

describe('meetingRecord', () => {
  it('summarizes the meeting: other speakers who spoke, the last line, the length', () => {
    const s = run(
      initialMeeting([{ id: 's1', name: 'Speaker 1', color: '' }, { id: 's2', name: 'Speaker 2', color: '' }, { id: 'me', name: 'You', color: '' }]),
      { type: 'line', line: { id: 'a', speaker: 's1', t: 0, text: 'Hi' } },
      { type: 'line', line: { id: 'b', speaker: 'me', t: 2, text: 'Hello' } },
      { type: 'tick' },
      { type: 'tick' },
    );
    const withFix = [
      { type: 'check-done' as const, line: 'b', errors: 1 },
      { type: 'result-start' as const, line: 'b', kind: 'fix' as const, text: 'Hello' },
      { type: 'result-done' as const, line: 'b', kind: 'fix' as const, result: { fix: { text: 'Hello!', edits: [] } } },
    ].reduce((acc, action) => meetingReducer(acc, { type: 'transcript', action }), s);
    expect(meetingRecord(withFix, 'meet.example.com', 1000)).toEqual({
      at: 1000,
      site: 'meet.example.com',
      seconds: 2,
      speakers: 1,
      last: 'You: Hello',
      cast: [{ id: 's1', name: 'Speaker 1', color: '' }, { id: 's2', name: 'Speaker 2', color: '' }, { id: 'me', name: 'You', color: '', me: true }],
      lines: [
        { speaker: 's1', t: 0, text: 'Hi' },
        { speaker: 'me', t: 2, text: 'Hello', errors: 1, fix: { text: 'Hello!', edits: [] } },
      ],
    });
  });

  it('is null when nobody spoke', () => {
    expect(meetingRecord(start(), 'x', 1)).toBeNull();
  });
});
