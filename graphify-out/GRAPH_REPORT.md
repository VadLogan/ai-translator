# Graph Report - ai-translator-ext  (2026-09-29)

## Corpus Check
- 164 files · ~63,552 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 937 nodes · 2248 edges · 39 communities (31 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `726c0356`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_vitest
- TranslatorWidget.stories.tsx
- TranslatorWidget.tsx
- graphify skill (SKILL.md)
- Home.tsx
- background.ts
- AI Translator API README
- dev-gateway.ts
- api/package.json
- ToolbarPopup.tsx
- scripts
- extension/package.json
- API architecture rules
- compilerOptions
- History.tsx
- Trigger.tsx
- buttons.tsx
- devDependencies
- icons.tsx
- compilerOptions
- imports
- typography.tsx
- Extension Icon 128px (translation speech bubbles)
- scripts
- Extension id pinning for OAuth redirect
- vitest.config.ts
- @tailwindcss/vite
- dependencies
- Home.stories.tsx
- ref_src_health_ts
- mount.ts
- contract.ts
- usePageEvents
- useTranslatorFlow.ts
- WidgetCallbacks
- CLAUDE.md
- TranslatorWidget
- extension_src_ui_theme
- ref_ui_theme_css_inline

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 55 edges
2. `react` - 26 edges
3. `fail()` - 20 edges
4. `sendMessage()` - 20 edges
5. `HistoryEntry` - 19 edges
6. `graphify skill (SKILL.md)` - 19 edges
7. `scopedLogger()` - 17 edges
8. `HomeProps` - 17 edges
9. `Icon()` - 16 edges
10. `findLanguage()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `Rules` --references--> `sendMessage()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/messaging/messages.ts
- `Rules` --references--> `TranslatorWidget()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/TranslatorWidget.tsx
- `ResponseMap` --references--> `DetectOk`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts
- `ResponseMap` --references--> `FixGrammarOk`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (39 total, 8 thin omitted)

### Community 0 - "ref_vitest"
Cohesion: 0.21
Nodes (8): request, toRow(), diff(), Segment, escapeHtml(), fromSegments(), tokenize(), ref_vitest

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.06
Nodes (29): Busy, Error, FAVORITES, FieldIcon, FieldIconChecking, FieldIconClean, FieldIconError, FieldIconErrors (+21 more)

### Community 2 - "TranslatorWidget.tsx"
Cohesion: 0.17
Nodes (21): Kbd(), PillButton(), Flag(), Divider(), Item(), Section(), Status(), Anchor (+13 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "Home.tsx"
Cohesion: 0.15
Nodes (18): IconButton(), CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select() (+10 more)

### Community 5 - "background.ts"
Cohesion: 0.05
Nodes (59): RFC-7636, ApiError, call(), check(), detect(), fixGrammar(), getSettings(), rewrite() (+51 more)

### Community 6 - "AI Translator API README"
Cohesion: 0.10
Nodes (21): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+13 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.10
Nodes (25): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+17 more)

### Community 8 - "api/package.json"
Cohesion: 0.08
Nodes (23): devDependencies, hono, @hono/node-server, openai, postgres, @types/node, @typesafe-ai/sdk, typescript (+15 more)

### Community 9 - "ToolbarPopup.tsx"
Cohesion: 0.07
Nodes (29): useHistory(), Notice, Options, useTranslation(), EntryActions, HistoryCard(), History(), HistoryProps (+21 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "API architecture rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "History.tsx"
Cohesion: 0.17
Nodes (16): Icon(), Group(), Row(), SubHeader(), Text(), browserLanguages(), findLanguage(), nativeName() (+8 more)

### Community 15 - "Trigger.tsx"
Cohesion: 0.24
Nodes (12): Badge, CountBadge(), clamp(), cornerStyle(), ICON_SIZE, iconStyle(), panelPosition(), Size (+4 more)

### Community 16 - "buttons.tsx"
Cohesion: 0.15
Nodes (10): ICON_SIZE, ICON_TONE, IconButtonProps, KBD_TONE, PILL_SIZE, PILL_VARIANT, PillButtonProps, Icon (+2 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, happy-dom, storybook, @storybook/react-vite, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+4 more)

### Community 18 - "icons.tsx"
Cohesion: 0.05
Nodes (42): BrandMark(), fixed(), ICON_NAMES, IconName, LANG_FLAG, PATHS, Brand, Flags (+34 more)

### Community 19 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, noUncheckedIndexedAccess, strict, extends, ./.wxt/tsconfig.json

### Community 20 - "imports"
Cohesion: 0.33
Nodes (5): imports, hono, openai, postgres, @typesafe-ai/sdk

### Community 21 - "typography.tsx"
Cohesion: 0.23
Nodes (9): Colours, meta, Scale, TONES, TEXT_TONE, TextTone, TextVariant, VARIANT (+1 more)

### Community 22 - "Extension Icon 128px (translation speech bubbles)"
Cohesion: 0.60
Nodes (5): Extension Icon 128px (translation speech bubbles), Extension Icon 16px, Extension Icon 32px, Extension Icon 48px, Translate Icon SVG (blue source bubble, yellow target bubble with A)

### Community 23 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build-storybook, compile, deploy, deploy:check, dev, dev:playground (+5 more)

### Community 27 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, flag-icons, @heroui/react, @heroui/styles, react, react-dom

### Community 28 - "Home.stories.tsx"
Cohesion: 0.09
Nodes (26): HISTORY, LATELY, noop(), now, PopupFrame(), Default, Empty, meta (+18 more)

### Community 30 - "mount.ts"
Cohesion: 0.11
Nodes (20): darkQuery(), followColorScheme(), subscribeDark(), usePrefersDark(), extension_src_components_theme, insertIntoFocusedField(), isInsertMessage(), main() (+12 more)

### Community 31 - "contract.ts"
Cohesion: 0.06
Nodes (78): app, jwt(), userToken(), checkController(), detectController(), fixGrammarController(), rewriteController(), getSettings() (+70 more)

### Community 33 - "useTranslatorFlow.ts"
Cohesion: 0.06
Nodes (102): isProviderId(), caretIn(), InsertMessage, dispatchInput(), replaceInContentEditable(), replaceInTextControl(), replaceSelection(), tryInsertText() (+94 more)

### Community 35 - "CLAUDE.md"
Cohesion: 0.29
Nodes (6): Typed background-worker messaging protocol, Closed shadow-root translator widget, Extension is frontend only, Layered API architecture, Paste-first selection replacement, AI Translator playground page

### Community 36 - "TranslatorWidget"
Cohesion: 0.40
Nodes (4): Constraints that outrank tidiness, Extension UI (`extension/src/`), Rules, TranslatorWidget()

## Knowledge Gaps
- **254 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 352 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `History.tsx` to `usePageEvents`, `useTranslatorFlow.ts`, `TranslatorWidget.tsx`, `Home.tsx`, `background.ts`, `ToolbarPopup.tsx`, `extension/package.json`, `Trigger.tsx`, `buttons.tsx`, `icons.tsx`, `typography.tsx`, `Home.stories.tsx`, `mount.ts`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `Rules` connect `TranslatorWidget` to `useTranslatorFlow.ts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `useTranslatorFlow()` (e.g. with `apply()` and `copyFix()`) actually correct?**
  _`useTranslatorFlow()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TranslatorWidget.stories.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `graphify skill (SKILL.md)` be split into smaller, more focused modules?**
  _Cohesion score 0.0613107822410148 - nodes in this community are weakly interconnected._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05239240844693932 - nodes in this community are weakly interconnected._