import { useEffect, useRef, useState } from 'react';
import type { FixEdit, FixGrammarOk } from '../../../../../shared/contract';
import type { GrammarView } from '../../../components/GrammarPanel';
import { applyEdits, withoutFixEdit } from '../../../core/fixEdits';
import { sendMessage } from '../../../messaging/messages';
import type { HistoryEntry } from '../../../settings/history';
import type { sentenceFixes } from '../../../core/sentenceFixes';

const editKey = (edit: FixEdit) => `${edit.original}→${edit.replacement}`;

/**
 * The popup's grammar fix of the input's text: the same panel as the in-page widget, one edit at a
 * time. Replace writes into the input; typing makes the fix stale, which hides it.
 */
export function useGrammarFix({ text, setText, remember, onError }: {
  text: string;
  setText(text: string): void;
  remember(entry: HistoryEntry): Promise<void>;
  onError(message: string): void;
}) {
  // `text`: what the fix was made for. `fix` null = loading.
  // `voice`: the text was dictated, so what is applied is marked as spoken in history.
  const [state, setState] = useState<{ text: string; fix: FixGrammarOk | null; index: number; ignored: string[]; voice?: boolean } | null>(null);
  const request = useRef('');

  /** `fixer`: a dictation's sentence fixes, mostly made while it was spoken; finished instead of one request. */
  const start = async (of: string, voice = false, fixer?: ReturnType<typeof sentenceFixes>) => {
    if (request.current) void sendMessage({ type: 'cancel', id: request.current });
    const id = (request.current = crypto.randomUUID());
    setState({ text: of, fix: null, index: 0, ignored: [], voice });
    const response = fixer ? await fixer.finish(of) : await sendMessage({ type: 'fix-grammar', text: of, id });
    if (request.current !== id) return;
    request.current = '';
    if (!response.ok) {
      setState(null);
      return onError(response.error.message);
    }
    setState({ text: of, fix: response.data, index: 0, ignored: [], voice });
  };

  const current = state && state.text === text ? state : null;
  const fix = current?.fix;
  const edits = fix ? fix.edits.filter((edit) => !current.ignored.includes(editKey(edit))) : [];
  const edit = edits[current?.index ?? 0];
  const record = (from: string, to: string) => void remember({ kind: 'grammar', text: from, result: to, site: '', at: Date.now(), ...(current?.voice ? { voice: true as const } : {}) });

  /** After an edit left: the next one slides in; none left = the panel goes. */
  const next = (fixed: string, nextFix: FixGrammarOk, ignored: string[]) => {
    const left = nextFix.edits.filter((e) => !ignored.includes(editKey(e))).length;
    setState(left ? { text: fixed, fix: nextFix, index: Math.min(current!.index, left - 1), ignored, voice: current!.voice } : null);
  };

  const view: GrammarView | null = current && {
    html: fix?.html,
    edits: edits.map(({ kind, original, replacement, reason }) => ({ kind, original, replacement, reason })),
    index: current.index,
    ignored: fix ? fix.edits.flatMap((e, i) => (edits.includes(e) ? [] : [i])) : [],
    onReplace: () => {
      if (!fix || !edit) return;
      const fixed = applyEdits(text, [edit]);
      setText(fixed);
      record(edit.original, edit.replacement);
      next(fixed, withoutFixEdit(fix, edit), current.ignored);
    },
    onIgnore: () => edit && fix && next(text, fix, [...current.ignored, editKey(edit)]),
    onReplaceAll: () => {
      const fixed = applyEdits(text, edits);
      setText(fixed);
      record(text, fixed);
      setState(null);
    },
    onStep: (index) => setState({ ...current, index }),
  };

  // ↵ replaces the shown edit, as in the widget -- except in the textarea, where it is a new line.
  const replace = useRef(view?.onReplace);
  replace.current = edit ? view?.onReplace : undefined;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || !replace.current || document.activeElement instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      replace.current();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return { view, start: (of: string, voice?: boolean, fixer?: ReturnType<typeof sentenceFixes>) => void start(of, voice, fixer) };
}
