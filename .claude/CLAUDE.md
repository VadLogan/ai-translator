# graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

# Prompts
When a request is ambiguous, underspecified, or typo-ridden, open with one `**Understood as:** …` line stating the cleaned-up request (plus any assumption), then proceed without waiting.

# Rules
Binding conventions live in `.claude/rules/`. Read the relevant file before changing code it covers.
- `rules/api-architecture.md` — the `api/src/` layers (entrypoint → wiring → middleware → controller → service → repository → db), what each may not do, and where new code goes.
