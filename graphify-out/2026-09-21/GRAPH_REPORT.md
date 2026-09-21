# Graph Report - ai-translator-ext  (2026-09-21)

## Corpus Check
- 74 files · ~30,223 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 407 nodes · 736 edges · 26 communities (19 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `745a3155`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- content.ts
- scripts
- CLAUDE.md
- extension/package.json
- What You Must Do When Invoked
- api/package.json
- extension/tsconfig.json
- vitest.config.ts
- graphify reference: extra exports and benchmark
- dev-jwt.ts
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- extraction-spec.md
- TranslatorWidget
- background.ts
- compilerOptions
- Selection Snapshot and isSelectionUnchanged Check
- AI Translator API
- app.ts
- imports
- ref_dotenv_config
- ref_node_crypto
- ref_node_fs_promises

## God Nodes (most connected - your core abstractions)
1. `TranslatorWidget` - 23 edges
2. `fail()` - 12 edges
3. `compilerOptions` - 12 edges
4. `main()` - 12 edges
5. `What You Must Do When Invoked` - 12 edges
6. `scripts` - 11 edges
7. `sendMessage()` - 11 edges
8. `AI Translator API` - 11 edges
9. `handle()` - 10 edges
10. `/graphify` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Step 0 — Constrained query expansion (REQUIRED before traversal)` --references--> `handler()`  [INFERRED]
  .claude/skills/graphify/references/query.md → api/src/health.ts
- ``POST /translate`` --references--> `userIdFrom()`  [INFERRED]
  api/README.md → api/src/middleware/auth.ts
- `ResponseMap` --references--> `DetectOk`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts
- `ResponseMap` --references--> `Settings`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts
- `ResponseMap` --references--> `TranslateOk`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Content Script Selection-to-Replacement Flow** — claude_selection_snapshot, claude_closed_shadow_root_widget, claude_requestid_stale_response_guard, claude_execcommand_insert_text_replacement [EXTRACTED 1.00]

## Communities (26 total, 7 thin omitted)

### Community 1 - "content.ts"
Cohesion: 0.09
Nodes (39): isProviderId(), ProviderId, PROVIDERS, dispatchInput(), replaceInContentEditable(), replaceInTextControl(), replaceSelection(), tryInsertText() (+31 more)

### Community 2 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 3 - "CLAUDE.md"
Cohesion: 0.22
Nodes (9): Adding a Translation Provider (4 steps), Translation Stays in Background Worker, graphify, Prompts, Dependency Inversion for Translation Engines, happy-dom Opt-in Test Environment, Mock Provider ([<lang>] <text>), Background Worker as Only Composition Root (+1 more)

### Community 4 - "extension/package.json"
Cohesion: 0.07
Nodes (25): description, devDependencies, happy-dom, typescript, vitest, wxt, typescript, vitest (+17 more)

### Community 5 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 6 - "api/package.json"
Cohesion: 0.09
Nodes (21): devDependencies, hono, @hono/node-server, openai, postgres, @types/node, typescript, vitest (+13 more)

### Community 7 - "extension/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noUncheckedIndexedAccess, strict, extends, ./.wxt/tsconfig.json

### Community 9 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 10 - "dev-jwt.ts"
Cohesion: 0.10
Nodes (23): checkDb(), sql, gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET (+15 more)

### Community 11 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 12 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 13 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 17 - "TranslatorWidget"
Cohesion: 0.15
Nodes (6): Anchor, WIDGET_CSS, clamp(), TranslatorWidget, WidgetCallbacks, ref_assets_translate_icon_svg_raw

### Community 18 - "background.ts"
Cohesion: 0.10
Nodes (34): RFC-7636, ApiError, call(), detect(), getSettings(), saveSettings(), translate(), base64url() (+26 more)

### Community 19 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 20 - "Selection Snapshot and isSelectionUnchanged Check"
Cohesion: 0.40
Nodes (5): CDP DOM.getDocument pierce for Closed Shadow Root Automation, Closed Shadow Root Translator Widget, execCommand insertText Replacement Strategy, requestId Stale Response Guard, Selection Snapshot and isSelectionUnchanged Check

### Community 21 - "AI Translator API"
Cohesion: 0.17
Nodes (11): AI Translator API, Configuration, Dependencies, Errors, `GET /functions/v1/health`, `GET /settings` and `PUT /settings`, Migrations, OAuth providers (+3 more)

### Community 22 - "app.ts"
Cohesion: 0.07
Nodes (50): app, jwt(), userToken(), detectController(), getSettings(), putSettings(), translateController(), detectLang() (+42 more)

### Community 23 - "imports"
Cohesion: 0.40
Nodes (4): imports, hono, openai, postgres

## Knowledge Gaps
- **143 isolated node(s):** `hono`, `openai`, `postgres`, `name`, `private` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 177 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hono` connect `app.ts` to `dev-jwt.ts`, `api/package.json`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `TranslatorWidget` connect `TranslatorWidget` to `content.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `userIdFrom()` connect `app.ts` to `AI Translator API`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `main()` (e.g. with `.destroy()` and `.owns()`) actually correct?**
  _`main()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09098639455782313 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._