# Graph Report - ai-translator-ext  (2026-09-23)

## Corpus Check
- 109 files · ~40,883 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 607 nodes · 1168 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6e91b28c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_vitest
- content.ts
- inputs.stories.tsx
- graphify skill (SKILL.md)
- contract.ts
- background.ts
- AI Translator API README
- dev-jwt.ts
- api/package.json
- API architecture rules
- scripts
- extension/package.json
- TranslatorWidget
- compilerOptions
- TranslatorWidget.stories.tsx
- TranslatorWidget.tsx
- buttons.tsx
- icons.tsx
- WidgetCallbacks
- compilerOptions
- imports
- Extension Icon 128px (translation speech bubbles)
- Extension id pinning for OAuth redirect
- vitest.config.ts

## God Nodes (most connected - your core abstractions)
1. `TranslatorWidget` - 20 edges
2. `graphify skill (SKILL.md)` - 19 edges
3. `fail()` - 16 edges
4. `scripts` - 13 edges
5. `main()` - 13 edges
6. `API architecture rules` - 13 edges
7. `compilerOptions` - 12 edges
8. `scopedLogger()` - 11 edges
9. `waitUntil()` - 11 edges
10. `AppEnv` - 10 edges

## Surprising Connections (you probably didn't know these)
- `ResponseMap` --references--> `DetectOk`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts
- `ResponseMap` --references--> `Settings`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts
- `ResponseMap` --references--> `TranslateOk`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts
- `Extension id pinning for OAuth redirect` --conceptually_related_to--> `Hand-rolled PKCE OAuth`  [INFERRED]
  api/README.md → CLAUDE.md
- `POST /detect` --references--> `Wrong keyboard layout (mistyped + switchLayout)`  [EXTRACTED]
  api/README.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (24 total, 4 thin omitted)

### Community 0 - "ref_vitest"
Cohesion: 0.10
Nodes (18): CorrectionRecord, request, toRow(), request, toRow(), request, toRow(), request (+10 more)

### Community 1 - "content.ts"
Cohesion: 0.06
Nodes (52): isProviderId(), PROVIDERS, dispatchInput(), replaceInContentEditable(), replaceInTextControl(), replaceSelection(), tryInsertText(), tryPaste() (+44 more)

### Community 2 - "inputs.stories.tsx"
Cohesion: 0.18
Nodes (14): CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select(), StatusChip() (+6 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "contract.ts"
Cohesion: 0.07
Nodes (63): app, jwt(), userToken(), detectController(), fixGrammarController(), rewriteController(), getSettings(), putSettings() (+55 more)

### Community 5 - "background.ts"
Cohesion: 0.11
Nodes (32): RFC-7636, ApiError, call(), detect(), getSettings(), saveSettings(), translate(), base64url() (+24 more)

### Community 6 - "AI Translator API README"
Cohesion: 0.08
Nodes (27): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+19 more)

### Community 7 - "dev-jwt.ts"
Cohesion: 0.11
Nodes (20): gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey(), jwks() (+12 more)

### Community 8 - "api/package.json"
Cohesion: 0.09
Nodes (22): devDependencies, hono, @hono/node-server, openai, postgres, @types/node, typescript, vitest (+14 more)

### Community 9 - "API architecture rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.04
Nodes (47): dependencies, @heroui/react, @heroui/styles, react, react-dom, description, devDependencies, happy-dom (+39 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "TranslatorWidget.stories.tsx"
Cohesion: 0.06
Nodes (28): Busy, Error, FAVORITES, Icon, Menu, MenuDetecting, MenuWithLayoutFix, MenuWithoutFavorites (+20 more)

### Community 15 - "TranslatorWidget.tsx"
Cohesion: 0.16
Nodes (10): Anchor, clamp(), iconStyle(), Panel(), TranslatorWidget(), TranslatorWidgetProps, Trigger(), react (+2 more)

### Community 16 - "buttons.tsx"
Cohesion: 0.15
Nodes (13): ICON_SIZE, ICON_TONE, IconButton(), IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT (+5 more)

### Community 17 - "icons.tsx"
Cohesion: 0.24
Nodes (11): BrandMark(), fixed(), Flag(), FLAGS, Icon(), ICON_NAMES, IconName, PATHS (+3 more)

### Community 19 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, noUncheckedIndexedAccess, strict, extends, ./.wxt/tsconfig.json

### Community 20 - "imports"
Cohesion: 0.40
Nodes (4): imports, hono, openai, postgres

### Community 22 - "Extension Icon 128px (translation speech bubbles)"
Cohesion: 0.60
Nodes (5): Extension Icon 128px (translation speech bubbles), Extension Icon 16px, Extension Icon 32px, Extension Icon 48px, Translate Icon SVG (blue source bubble, yellow target bubble with A)

## Knowledge Gaps
- **193 isolated node(s):** `hono`, `openai`, `postgres`, `DEV_JWT_SECRET`, `ASYMMETRIC` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 244 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `TranslatorWidget.tsx` to `content.ts`, `inputs.stories.tsx`, `extension/package.json`, `TranslatorWidget.stories.tsx`, `buttons.tsx`, `icons.tsx`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `hono` connect `contract.ts` to `api/package.json`, `dev-jwt.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `@storybook/react-vite` connect `TranslatorWidget.stories.tsx` to `content.ts`, `inputs.stories.tsx`, `extension/package.json`, `buttons.tsx`, `icons.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.10483870967741936 - nodes in this community are weakly interconnected._
- **Should `content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05754527162977867 - nodes in this community are weakly interconnected._
- **Should `graphify skill (SKILL.md)` be split into smaller, more focused modules?**
  _Cohesion score 0.0613107822410148 - nodes in this community are weakly interconnected._