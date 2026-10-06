import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelEdit } from './utils/toEdits.ts';

const create = vi.fn();
vi.mock('../../client.ts', () => ({ MODEL: 'm', client: { responses: { create: (...args: unknown[]) => create(...args) } } }));
const { fixGrammar } = await import('./fix-grammar.ts');

/** The model answers these edits to whatever text it was given. */
function modelSays(edits: ModelEdit[]) {
  create.mockImplementation(async () =>
    (async function* () {
      yield { type: 'response.output_text.done', text: JSON.stringify({ edits }) };
    })(),
  );
}
const edit = (original: string, replacement: string): ModelEdit => ({ original, replacement, kind: 'error', reason: 'r' });

describe('fixGrammar with exceptions', () => {
  beforeEach(() => create.mockReset());

  it('hides a term from the model and drops an edit that would change it', async () => {
    modelSays([edit('run {{1}}', 'run cubectl'), edit('yesterday', 'yesterday.')]);
    const { text, edits } = await fixGrammar({ text: 'I run kubectl yesterday', exceptions: [{ term: 'kubectl', kind: 'Code', replaces: [] }] });
    expect(create.mock.lastCall?.[0].input).toBe('I run {{1}} yesterday');
    expect(text).toBe('I run kubectl yesterday.');
    expect(edits.map((e) => e.original)).toEqual(['yesterday']);
  });

  it('turns a wrong form into the term, with offsets into the request text', async () => {
    modelSays([edit('i open', 'I open')]);
    const { text, edits } = await fixGrammar({ text: 'i open jira', exceptions: [{ term: 'Jira', kind: 'Brand', replaces: ['jira'] }] });
    expect(text).toBe('I open Jira');
    expect(edits.map(({ start, end, original, replacement }) => ({ start, end, original, replacement }))).toEqual([
      { start: 0, end: 1, original: 'i', replacement: 'I' },
      { start: 7, end: 11, original: 'jira', replacement: 'Jira' },
    ]);
  });
});
