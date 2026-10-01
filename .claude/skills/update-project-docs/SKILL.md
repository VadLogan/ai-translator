---
name: update-project-docs
description: Use when a session changed code, decided something, or turned up a gotcha that the project docs don't reflect yet — at the end of a feature, refactor or investigation, after the user corrected how something works, or when the user says "update docs", "sync docs", "document this session", "update rules", "update CLAUDE.md", or invokes /update-project-docs.
---

# Update project docs

Turn what this session learned into durable project documentation, and fix doc drift the session's
changes caused. **Code is the source of truth**: a doc says what the code does and why. Never change
code to match a doc.

## 1. Collect two inputs

**A. Session facts.** Re-read the conversation (or its summary). Write a list of candidate facts:

| Kind | Example | Keep? |
| --- | --- | --- |
| Decision + why | "history stays local, by choice" | yes |
| User correction of a wrong assumption | "the guard fails open, not closed" | yes |
| New/changed behaviour, route, message, table, env var, folder | `POST /stats/dictation` | yes |
| Gotcha found the hard way | "a stale `vi.mock` path loads the real client and throws" | yes |
| Finding / known bug left open | "health entrypoint points at a missing file" | yes, in the findings table |
| Step-by-step story of the session, dead ends, chat-only answers | — | no |
| Anything the code already makes obvious | — | no |

**B. Code delta and drift.** Run:

```bash
bash .claude/skills/update-project-docs/inventory.sh [base-ref]
```

It prints changed files, API routes, error codes, extension message types, storage keys, env vars,
permissions, migrations, `config.toml` paths that don't exist, folders, and doc-named paths that don't
exist. Default base is `HEAD` (uncommitted work); pass the branch point (e.g. `main`) for a whole branch.
Read the changed source files themselves; the inventory only points at them.

## 2. Route each fact to one home

| Fact is about… | Owner file | Section |
| --- | --- | --- |
| Commands, env setup, how to run/test | `CLAUDE.md` | Commands / Testing notes |
| Behaviour and its reasons (one paragraph per feature) | `CLAUDE.md` | Architecture / feature paragraphs |
| API layers, folder map, "where new code goes", layer exceptions | `.claude/rules/api-architecture.md` | |
| Extension UI split, import rules, folder map | `.claude/rules/extension-ui.md` | |
| Which rules/skills exist | `.claude/CLAUDE.md` | Rules / skills list |
| Endpoint table, validation, errors, data model, config, external services | `docs/api.md` | §5, §8, §9, §4 |
| Client-agnostic flows, portable modules, client-owned data | `docs/frontend.md` | §3, §4, §5 |
| Extension contexts, manifest, messages, browser APIs, storage keys, layout | `docs/extension.md` | §1–§7 |
| Product overview, responsibility split, open findings | `docs/README.md` | §1, §3, §5 |
| Wire types and limits | `shared/contract.ts` doc comments | |

One fact gets one full statement; other files link to it. If a fact fits nowhere, add it to the
nearest section; create a new doc only if the user asks.

## 3. Edit

1. For every inventory item, compare it with the matching table in its owner doc (routes ↔ `docs/api.md` §5, message types ↔ `docs/extension.md` §4.1, storage keys ↔ §6, env vars ↔ `docs/api.md` §9 / `docs/extension.md` §2, folders ↔ the folder maps in both rules files). Add what is missing, remove what is gone, fix what changed.
2. Fix every "path that does not exist" hit, unless the doc names it on purpose (e.g. a finding about a stale reference).
3. Write the session facts into their owner sections, in the style of the surrounding text: same density, backticked identifiers, the *why* in the same sentence.
4. Findings table (`docs/README.md` §5): remove rows the session fixed, add new open ones with file and consequence. Update the snapshot line at the top of `docs/README.md`.
5. Keep edits surgical. Don't reflow or rewrite paragraphs the session didn't touch.

Don't edit applied migrations, `graphify-out/`, or memory files. Don't commit.

## 4. Verify and report

- Re-run `inventory.sh`; its "does not exist" sections should only list deliberate mentions.
- Reply with: each changed file and a one-line summary of the change; facts you chose not to record and why; doc-vs-code contradictions the session didn't settle (ask the user, don't guess).
- If the code changed, remind the user to run `graphify update .` (per `CLAUDE.md`).

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Writing the session as a story ("we tried X, then Y") | Write the end state and its reason |
| Copying the same paragraph into `CLAUDE.md` and `docs/` | One home, link from the others |
| "Fixing" code so a doc becomes true | Report the contradiction; the code wins until the user decides |
| Updating only the file you remember | Walk the whole routing table against the inventory |
| Documenting from memory | Check each claim against the source before writing it |
