import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { emptyTranscript, lineView, transcriptActions, transcriptReducer, type Check, type ResultKind } from '../../../core/transcript';
import { sendMessage } from '../../../messaging/messages';
import { transcriptSenders } from '../../../messaging/transcriptSenders';
import { meetingsStore, transcriptText, type MeetingLine, type MeetingRecord } from '../../../settings/meetings';
import { storageSettings } from '../../../settings/storage-settings';

export type SummaryState = { status: 'idle' } | { status: 'loading' } | { status: 'error' } | { status: 'done'; points: string[] };

const lineId = (index: number) => `l${index}`;
const indexOf = (id: string) => Number(id.slice(1));

/**
 * One saved meeting in the popup: its transcript with the same actions as the live card, the
 * user's lines checked on open when the card hadn't, and the summary. What it fetches (error
 * counts, fixes, the summary) is written back to the record, so reopening asks nothing again.
 */
export function useMeetingDetail(record: MeetingRecord, onSaved: () => void) {
  const lines = record.lines ?? [];
  const me = record.cast?.find((s) => s.me)?.id;
  const [state, dispatch] = useReducer(transcriptReducer, lines, (list) =>
    emptyTranscript(Object.fromEntries(list.flatMap((l, i): [string, Check][] => (l.errors === undefined ? [] : [[lineId(i), { status: 'done', errors: l.errors }]])))),
  );
  const [summary, setSummary] = useState<SummaryState>(record.summary ? { status: 'done', points: record.summary } : { status: 'idle' });
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(state);
  latest.current = state;

  const patchLine = (index: number, patch: Partial<MeetingLine>) =>
    void meetingsStore.update(record.at, (r) => ({ ...r, lines: r.lines?.map((l, i) => (i === index ? { ...l, ...patch } : l)) })).then(onSaved);

  const actions = useMemo(
    () =>
      transcriptActions({
        ...transcriptSenders(`Meeting · ${record.site}`),
        dispatch,
        cachedFix: (id) => lines[indexOf(id)]?.fix,
        onChecked: (id, errors) => patchLine(indexOf(id), { errors }),
        onFixed: (id, fix) => patchLine(indexOf(id), { fix }),
      }),
    // One record per screen (the container keys the screen by the meeting), so built once.
    [record.at],
  );

  // The user's lines the live card didn't get to check, two at a time.
  useEffect(() => {
    const todo = lines.flatMap((l, i) => (l.speaker === me && l.errors === undefined ? [{ id: lineId(i), text: l.text }] : []));
    const worker = async () => {
      for (let next = todo.shift(); next; next = todo.shift()) await actions.check(next);
    };
    void Promise.all([worker(), worker()]);
  }, [actions]);

  const speaker = (id: string) => {
    const s = record.cast?.find((x) => x.id === id);
    return { name: s?.name ?? 'Unknown', color: s?.color ?? '#71717A' };
  };
  const line = (id: string) => ({ id, text: lines[indexOf(id)]?.text ?? '' });

  return {
    lines: record.lines ? lines.map((l, i) => lineView(state, { id: lineId(i), t: l.t, text: l.text, me: l.speaker === me }, speaker(l.speaker))) : null,
    summary,
    notice,
    onHighlight: (id: string, from: number, to: number) => dispatch({ type: 'highlight', highlight: { line: id, from, to } }),
    onClearHighlight: () => dispatch({ type: 'highlight', highlight: null }),
    onAction: (id: string, kind: Exclude<ResultKind, 'fix'>) => {
      const highlight = latest.current.highlight;
      if (highlight?.line === id) void actions.run(kind, line(id), highlight);
    },
    onShowFixes: (id: string, open: boolean) => void actions.showFixes(line(id), open),
    onCloseResult: (id: string) => dispatch({ type: 'close-result', line: id }),
    onUndoVocab: (id: string) => {
      const result = latest.current.results[id];
      if (result) void actions.undoVocab(id, result);
    },
    onCopy: () =>
      void navigator.clipboard.writeText(transcriptText(record)).then(() => {
        setNotice('Copied');
        setTimeout(() => setNotice(null), 1500);
      }),
    onSummarize: async () => {
      setSummary({ status: 'loading' });
      const targetLang = (await storageSettings.get()).favoriteLanguages[0] ?? 'en';
      const answer = await sendMessage({ type: 'summarize', lines: lines.map((l) => ({ speaker: speaker(l.speaker).name, text: l.text })), targetLang });
      if (!answer.ok) return setSummary({ status: 'error' });
      setSummary({ status: 'done', points: answer.data.points });
      void meetingsStore.update(record.at, (r) => ({ ...r, summary: answer.data.points })).then(onSaved);
    },
  };
}
