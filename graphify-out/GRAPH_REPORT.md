# Graph Report - ai-translator-ext  (2026-09-17)

## Corpus Check
- 46 files · ~18,153 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 299 nodes · 459 edges · 21 communities (17 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `03e9e583`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- background.ts
- content.ts
- scripts
- CLAUDE.md
- extension/package.json
- What You Must Do When Invoked
- api/package.json
- extension/tsconfig.json
- vitest.config.ts
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- extraction-spec.md
- TranslatorWidget
- app.ts
- compilerOptions
- Selection Snapshot and isSelectionUnchanged Check

## God Nodes (most connected - your core abstractions)
1. `TranslatorWidget` - 20 edges
2. `compilerOptions` - 12 edges
3. `What You Must Do When Invoked` - 12 edges
4. `scripts` - 11 edges
5. `TranslatorRegistry` - 11 edges
6. `TranslationError` - 11 edges
7. `/graphify` - 10 edges
8. `TranslateResult` - 9 edges
9. `main()` - 9 edges
10. `getEditableSelection()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Content Script to Background Architecture Diagram` --semantically_similar_to--> `Dependency Inversion for Translation Engines`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `DeepL Provider Example` --semantically_similar_to--> `Mock Provider ([<lang>] <text>)`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `Adding a Translation Provider (4 steps)` --cites--> `Adding a Translation Provider (README)`  [EXTRACTED]
  CLAUDE.md → README.md
- `main()` --calls--> `TranslatorWidget`  [EXTRACTED]
  extension/src/entrypoints/content.ts → extension/src/content/ui/translator-widget.ts
- `showLanguages()` --indirect_call--> `findLanguage()`  [INFERRED]
  extension/src/entrypoints/content.ts → extension/src/core/languages.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Content Script Selection-to-Replacement Flow** — claude_selection_snapshot, claude_closed_shadow_root_widget, claude_requestid_stale_response_guard, claude_execcommand_insert_text_replacement [EXTRACTED 1.00]
- **Pluggable Provider Extension Pattern** — claude_dependency_inversion_translation_engines, claude_single_composition_root, claude_add_provider_procedure, readme_deepl_provider_example, claude_mock_provider [INFERRED 0.85]

## Communities (21 total, 4 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.08
Nodes (29): ProviderInfo, TranslatorRegistry, setup(), TranslationService, TranslateRequest, TranslateResult, TranslationError, TranslationErrorCode (+21 more)

### Community 1 - "content.ts"
Cohesion: 0.11
Nodes (29): dispatchInput(), replaceInContentEditable(), replaceInTextControl(), replaceSelection(), tryInsertText(), deepActiveElement(), EditableSelection, findContentEditableHost() (+21 more)

### Community 2 - "scripts"
Cohesion: 0.15
Nodes (12): name, private, scripts, build, compile, dev, dev:api, dev:extension (+4 more)

### Community 3 - "CLAUDE.md"
Cohesion: 0.18
Nodes (11): Adding a Translation Provider (4 steps), Translation Stays in Background Worker, graphify, Dependency Inversion for Translation Engines, happy-dom Opt-in Test Environment, Mock Provider ([<lang>] <text>), Background Worker as Only Composition Root, Typed Messaging Protocol (translate, list-providers, open-options) (+3 more)

### Community 4 - "extension/package.json"
Cohesion: 0.07
Nodes (25): description, devDependencies, happy-dom, typescript, vitest, wxt, typescript, vitest (+17 more)

### Community 5 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 6 - "api/package.json"
Cohesion: 0.10
Nodes (20): dependencies, hono, @hono/node-server, devDependencies, @types/node, typescript, vitest, typescript (+12 more)

### Community 7 - "extension/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noUncheckedIndexedAccess, strict, extends, ./.wxt/tsconfig.json

### Community 9 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 10 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

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
Cohesion: 0.20
Nodes (3): clamp(), TranslatorWidget, WidgetCallbacks

### Community 18 - "app.ts"
Cohesion: 0.15
Nodes (11): app, hits, port, translate(), ref_hono_cors, @hono/node-server, ApiErrorCode, MAX_TEXT_LENGTH (+3 more)

### Community 19 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 20 - "Selection Snapshot and isSelectionUnchanged Check"
Cohesion: 0.40
Nodes (5): CDP DOM.getDocument pierce for Closed Shadow Root Automation, Closed Shadow Root Translator Widget, execCommand insertText Replacement Strategy, requestId Stale Response Guard, Selection Snapshot and isSelectionUnchanged Check

## Knowledge Gaps
- **113 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+108 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 147 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hono` connect `api/package.json` to `app.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `TranslatorWidget` connect `TranslatorWidget` to `content.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _113 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08458646616541353 - nodes in this community are weakly interconnected._
- **Should `content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1064102564102564 - nodes in this community are weakly interconnected._
- **Should `extension/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `What You Must Do When Invoked` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._