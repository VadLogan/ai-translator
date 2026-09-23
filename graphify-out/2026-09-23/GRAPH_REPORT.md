# Graph Report - ai-translator-ext  (2026-09-23)

## Corpus Check
- Corpus is ~40,530 words - fits in a single context window. You may not need a graph.

## Summary
- 607 nodes · 1167 edges · 26 communities (22 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.85)
- Token cost: 192,704 input · 0 output

## Community Hubs (Navigation)
- API Entrypoints & Tests
- Selection & Text Replacement
- Translator Widget UI Parts
- Graphify Skill Docs
- API Controllers & Routes
- Extension API Client & OAuth
- Project Docs & Routes
- Dev Gateway & JWT
- API Package Manifest
- API Layering Rules
- Root Workspace Scripts
- Extension Package Manifest
- TranslatorWidget Class
- API TS Config
- Widget Stories
- Extension Scripts
- Typography System
- Extension Dev Dependencies
- Storybook Theme Setup
- Extension TS Config
- Deno Import Map
- Extension Runtime Deps
- Extension Icons
- WXT Config
- PKCE OAuth Rationale
- Vitest Config

## God Nodes (most connected - your core abstractions)
1. `TranslatorWidget` - 20 edges
2. `graphify skill (SKILL.md)` - 19 edges
3. `fail()` - 16 edges
4. `scripts` - 13 edges
5. `main()` - 13 edges
6. `compilerOptions` - 12 edges
7. `API architecture rules` - 12 edges
8. `scopedLogger()` - 11 edges
9. `waitUntil()` - 11 edges
10. `AppEnv` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Options page HTML (AI Translator settings)` --conceptually_related_to--> `Settings cache (server-authoritative)`  [INFERRED]
  extension/src/entrypoints/options/index.html → CLAUDE.md
- `POST /detect` --references--> `Wrong keyboard layout (mistyped + switchLayout)`  [EXTRACTED]
  api/README.md → CLAUDE.md
- `POST /fix-grammar` --shares_data_with--> `POST /detect`  [EXTRACTED]
  CLAUDE.md → api/README.md
- `Extension id pinning for OAuth redirect` --conceptually_related_to--> `Hand-rolled PKCE OAuth`  [INFERRED]
  api/README.md → CLAUDE.md
- `AI Translator playground page` --conceptually_related_to--> `Paste-first selection replacement`  [INFERRED]
  extension/playground/index.html → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (26 total, 4 thin omitted)

### Community 0 - "API Entrypoints & Tests"
Cohesion: 0.05
Nodes (55): handler(), jwt(), userToken(), env(), get(), CorrectionRecord, correctionsRepository, request (+47 more)

### Community 1 - "Selection & Text Replacement"
Cohesion: 0.06
Nodes (53): isProviderId(), PROVIDERS, dispatchInput(), replaceInContentEditable(), replaceInTextControl(), replaceSelection(), tryInsertText(), tryPaste() (+45 more)

### Community 2 - "Translator Widget UI Parts"
Cohesion: 0.05
Nodes (47): Anchor, clamp(), iconStyle(), Panel(), PanelBody(), TranslatorWidgetProps, Trigger(), WidgetCallbacks (+39 more)

### Community 3 - "Graphify Skill Docs"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "API Controllers & Routes"
Cohesion: 0.15
Nodes (31): detectController(), fixGrammarController(), rewriteController(), getSettings(), putSettings(), translateController(), requireUser(), userIdFrom() (+23 more)

### Community 5 - "Extension API Client & OAuth"
Cohesion: 0.11
Nodes (33): RFC-7636, ApiError, call(), detect(), getSettings(), saveSettings(), translate(), base64url() (+25 more)

### Community 6 - "Project Docs & Routes"
Cohesion: 0.08
Nodes (27): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+19 more)

### Community 7 - "Dev Gateway & JWT"
Cohesion: 0.13
Nodes (15): gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey(), jwks() (+7 more)

### Community 8 - "API Package Manifest"
Cohesion: 0.09
Nodes (22): devDependencies, hono, @hono/node-server, openai, postgres, @types/node, typescript, vitest (+14 more)

### Community 9 - "API Layering Rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

### Community 10 - "Root Workspace Scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "Extension Package Manifest"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, happy-dom (+8 more)

### Community 13 - "API TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Widget Stories"
Cohesion: 0.14
Nodes (12): Busy, Error, FAVORITES, Icon, Menu, MenuDetecting, MenuWithLayoutFix, MenuWithoutFavorites (+4 more)

### Community 15 - "Extension Scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build-storybook, compile, deploy, deploy:check, dev, dev:playground (+5 more)

### Community 16 - "Typography System"
Cohesion: 0.22
Nodes (10): Colours, meta, Scale, TONES, Text(), TEXT_TONE, TextTone, TextVariant (+2 more)

### Community 17 - "Extension Dev Dependencies"
Cohesion: 0.17
Nodes (12): devDependencies, happy-dom, storybook, @storybook/react-vite, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+4 more)

### Community 18 - "Storybook Theme Setup"
Cohesion: 0.22
Nodes (6): extension_src_ui_theme, config, globalTypes, initialGlobals, preview, @storybook/react-vite

### Community 19 - "Extension TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, noUncheckedIndexedAccess, strict, extends, ./.wxt/tsconfig.json

### Community 20 - "Deno Import Map"
Cohesion: 0.40
Nodes (4): imports, hono, openai, postgres

### Community 21 - "Extension Runtime Deps"
Cohesion: 0.40
Nodes (5): dependencies, @heroui/react, @heroui/styles, react, react-dom

### Community 22 - "Extension Icons"
Cohesion: 0.60
Nodes (5): Extension Icon 128px (translation speech bubbles), Extension Icon 16px, Extension Icon 32px, Extension Icon 48px, Translate Icon SVG (blue source bubble, yellow target bubble with A)

## Knowledge Gaps
- **193 isolated node(s):** `hono`, `openai`, `postgres`, `DEV_JWT_SECRET`, `ASYMMETRIC` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 244 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Translator Widget UI Parts` to `Typography System`, `Selection & Text Replacement`, `Extension Package Manifest`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `hono` connect `API Controllers & Routes` to `API Package Manifest`, `Dev Gateway & JWT`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `@storybook/react-vite` connect `Storybook Theme Setup` to `Selection & Text Replacement`, `Translator Widget UI Parts`, `Extension Package Manifest`, `Widget Stories`, `Typography System`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Entrypoints & Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.05052125100240577 - nodes in this community are weakly interconnected._
- **Should `Selection & Text Replacement` be split into smaller, more focused modules?**
  _Cohesion score 0.05669710806697108 - nodes in this community are weakly interconnected._
- **Should `Translator Widget UI Parts` be split into smaller, more focused modules?**
  _Cohesion score 0.050203527815468114 - nodes in this community are weakly interconnected._