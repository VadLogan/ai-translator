# graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

# Docs
- **update-project-docs** (`.claude/skills/update-project-docs/SKILL.md`) - records what a session decided or found and fixes doc drift in `CLAUDE.md`, `.claude/rules/` and `docs/`. Trigger: `/update-project-docs`, "update docs", or the end of a change set.

# Prompts
When a request is only typo-ridden or loosely worded but its meaning is clear, open with one `**Understood as:** …` line stating the cleaned-up request, then proceed without waiting.

**Always ask before acting** (AskUserQuestion) when:
- you are in doubt about what is wanted, or could have misunderstood the request;
- there are two (or more) comparable solutions: lay out each with its trade-offs and let the user pick the better one. Don't choose silently.

# Rules
Binding conventions live in `.claude/rules/`. Read the relevant file before changing code it covers.
- `rules/api-architecture.md` — the `api/src/` layers (entrypoint → wiring → middleware → controller → service → repository → db), what each may not do, and where new code goes.
- `rules/extension-ui.md` — the `extension/src/` UI split (entrypoints → containers → hooks → pure view → presentational components), what each may import.
