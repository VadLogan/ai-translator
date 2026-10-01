---
name: demo
description: Build a Storybook demo of the UI changes made in the current Claude session, each change labelled with an h6 heading, then build Storybook and open the story. Every invocation creates a new story file, so earlier demos from the same session stay untouched. Use when the user says "demo", "show me the changes in storybook", "make a demo story", or invokes /demo.
---

# Demo

Goal: one new Storybook story that shows what changed in **this session**, so it can be checked by eye. Never commit.

## 1. Collect the session's changes

- Scope = files you created or edited **in this conversation** (from the conversation itself, plus the summary if context was compacted). Not the whole `git diff` — the working tree usually has unrelated uncommitted work.
- Keep only renderable UI under `extension/src/**` (components, popup screens, widgets, theme/CSS). Logic-only changes: list them in the Overview h6s only if they change what a component shows.
- If an earlier `/demo` ran in this session, still cover everything changed in the session, and mark changes made since the previous demo with `(new)` in their h6.
- Nothing renderable → tell the user and stop.

## 2. Pick the next file

```bash
ls extension/src/demo/ 2>/dev/null
```

Next `N` = highest `Session<N>.stories.tsx` + 1 (start at 1). **Never edit or delete an existing demo file** — every invocation writes a new one.

## 3. Write `extension/src/demo/Session<N>.stories.tsx`

Storybook already globs `src/**/*.stories.tsx` and applies the light/dark theme decorator from `.storybook/preview.tsx`; no config change needed.

- `const meta = { title: 'Demo/Session <N> — <YYYY-MM-DD HH:mm>' } satisfies Meta; export default meta;`
- Render the **real** components with real fixtures. Reuse args/decorators from the component's existing story (e.g. `src/popups/toolbar/screens/Home.stories.tsx` with `PopupFrame` and `noop`/`HISTORY` from `src/popups/toolbar/fixtures.ts`) instead of inventing props.
- Put an h6 above every block that says what changed — file and the change in one line:

```tsx
const H6 = 'mb-2 text-xs font-bold uppercase tracking-wide text-tm-accent';

<h6 className={H6}>Home.tsx — swap button moved next to language pair</h6>
```

- Exports:
  - `Overview` (first): every change as h6 + its rendered state, stacked in a `flex flex-col gap-8`.
  - One export per changed component/state, same h6 + render, for focused viewing.
- Show before/after side by side only when the old state is still renderable (e.g. a prop/variant still exists); don't recreate deleted code.

## 4. Build

From the repo root:

```bash
npm run build-storybook -w extension
```

Fix errors in the demo file and rebuild until it passes. If the failure is in non-demo code, report it instead of fixing it silently.

## 5. Show

- `preview_start` with name `storybook` (from `.claude/launch.json`, port 6006).
- Navigate to `http://localhost:6006/?path=/story/demo-session-<N>-<date-slug>--overview` (find the exact id in the sidebar if the slug differs), take a screenshot, check the h6s and components render.
- Report: the file created, the story URL, the list of changes shown.

Mention once that `extension/src/demo/` is demo-only output; the user decides whether to delete or gitignore it.
