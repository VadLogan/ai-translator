# Graph Report - ai-translator-ext  (2026-09-17)

## Corpus Check
- 37 files · ~16,332 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 227 nodes · 371 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- background.ts
- content.ts
- package.json
- CLAUDE.md
- TranslatorWidget
- What You Must Do When Invoked
- translator-widget.ts
- tsconfig.json
- ref_vitest_config
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `TranslatorWidget` - 20 edges
2. `What You Must Do When Invoked` - 12 edges
3. `TranslatorRegistry` - 11 edges
4. `/graphify` - 10 edges
5. `scripts` - 9 edges
6. `TranslationError` - 9 edges
7. `main()` - 9 edges
8. `getEditableSelection()` - 8 edges
9. `sendMessage()` - 8 edges
10. `graphify reference: extra exports and benchmark` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Content Script to Background Architecture Diagram` --semantically_similar_to--> `Dependency Inversion for Translation Engines`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `DeepL Provider Example` --semantically_similar_to--> `Mock Provider ([<lang>] <text>)`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `Password Input (ignored by extension)` --conceptually_related_to--> `Selection Snapshot and isSelectionUnchanged Check`  [INFERRED]
  playground/index.html → CLAUDE.md
- `Favorite Languages Section (#languages)` --shares_data_with--> `Closed Shadow Root Translator Widget`  [INFERRED]
  src/entrypoints/options/index.html → CLAUDE.md
- `Translation Provider Dropdown (#provider)` --conceptually_related_to--> `Typed Messaging Protocol (translate, list-providers, open-options)`  [INFERRED]
  src/entrypoints/options/index.html → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Content Script Selection-to-Replacement Flow** — claude_selection_snapshot, claude_closed_shadow_root_widget, claude_requestid_stale_response_guard, claude_execcommand_insert_text_replacement [EXTRACTED 1.00]
- **Pluggable Provider Extension Pattern** — claude_dependency_inversion_translation_engines, claude_single_composition_root, claude_add_provider_procedure, readme_deepl_provider_example, claude_mock_provider [INFERRED 0.85]

## Communities (17 total, 4 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.09
Nodes (26): ref_wxt_browser, ref_wxt_utils_define_background, ref_wxt_utils_storage, ProviderInfo, TranslatorRegistry, setup(), TranslationService, TranslateRequest (+18 more)

### Community 1 - "content.ts"
Cohesion: 0.15
Nodes (22): vitest, ref_wxt_utils_define_content_script, dispatchInput(), replaceInContentEditable(), replaceInTextControl(), replaceSelection(), tryInsertText(), deepActiveElement() (+14 more)

### Community 2 - "package.json"
Cohesion: 0.08
Nodes (22): description, devDependencies, happy-dom, typescript, vitest, wxt, name, private (+14 more)

### Community 3 - "CLAUDE.md"
Cohesion: 0.11
Nodes (21): Adding a Translation Provider (4 steps), Translation Stays in Background Worker, CDP DOM.getDocument pierce for Closed Shadow Root Automation, graphify, Closed Shadow Root Translator Widget, Dependency Inversion for Translation Engines, execCommand insertText Replacement Strategy, happy-dom Opt-in Test Environment (+13 more)

### Community 4 - "TranslatorWidget"
Cohesion: 0.20
Nodes (3): clamp(), TranslatorWidget, WidgetCallbacks

### Community 5 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 6 - "translator-widget.ts"
Cohesion: 0.24
Nodes (8): WIDGET_CSS, Point, Language, LANGUAGES, init(), setStatus(), sendMessage(), storageSettings

### Community 7 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): ./.wxt/tsconfig.json, compilerOptions, noUncheckedIndexedAccess, strict, extends

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

## Knowledge Gaps
- **69 isolated node(s):** `name`, `description`, `private`, `version`, `type` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 95 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `content.ts` to `background.ts`, `package.json`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `TranslatorWidget` connect `TranslatorWidget` to `content.ts`, `translator-widget.ts`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `name`, `description`, `private` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0946938775510204 - nodes in this community are weakly interconnected._
- **Should `content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1477832512315271 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `CLAUDE.md` be split into smaller, more focused modules?**
  _Cohesion score 0.11067193675889328 - nodes in this community are weakly interconnected._