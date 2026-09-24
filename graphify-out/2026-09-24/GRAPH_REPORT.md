# Graph Report - ai-translator-ext  (2026-09-24)

## Corpus Check
- 116 files · ~46,388 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 687 nodes · 1370 edges · 32 communities (29 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `910f1952`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- controllers/fix-grammar.ts
- Translator.tsx
- inputs.stories.tsx
- graphify skill (SKILL.md)
- contract.ts
- background.ts
- AI Translator API README
- dev-gateway.ts
- api/package.json
- API architecture rules
- scripts
- extension/package.json
- TranslatorWidget.stories.tsx
- compilerOptions
- typography.stories.tsx
- TranslatorWidget.tsx
- buttons.tsx
- devDependencies
- icons.tsx
- compilerOptions
- imports
- OptionsPage.stories.tsx
- Extension Icon 128px (translation speech bubbles)
- scripts
- Extension id pinning for OAuth redirect
- vitest.config.ts
- icons.stories.tsx
- dependencies
- @storybook/react-vite
- ref_src_health_ts
- WidgetCallbacks
- translator-widget.ts

## God Nodes (most connected - your core abstractions)
1. `Translator()` - 36 edges
2. `graphify skill (SKILL.md)` - 19 edges
3. `fail()` - 16 edges
4. `scripts` - 13 edges
5. `sendMessage()` - 13 edges
6. `API architecture rules` - 13 edges
7. `compilerOptions` - 12 edges
8. `handle()` - 12 edges
9. `scopedLogger()` - 11 edges
10. `waitUntil()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Check` --references--> `FixGrammarOk`  [EXTRACTED]
  extension/src/content/ui/translator-state.ts → shared/contract.ts
- `ResponseMap` --references--> `FixGrammarOk`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts
- `Extension id pinning for OAuth redirect` --conceptually_related_to--> `Hand-rolled PKCE OAuth`  [INFERRED]
  api/README.md → CLAUDE.md
- `POST /detect` --references--> `Wrong keyboard layout (mistyped + switchLayout)`  [EXTRACTED]
  api/README.md → CLAUDE.md
- `POST /fix-grammar` --shares_data_with--> `POST /detect`  [EXTRACTED]
  CLAUDE.md → api/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (32 total, 3 thin omitted)

### Community 0 - "controllers/fix-grammar.ts"
Cohesion: 0.16
Nodes (14): CorrectionRecord, correctionsRepository, request, toRow(), fixGrammar(), diff(), Segment, escapeHtml() (+6 more)

### Community 1 - "Translator.tsx"
Cohesion: 0.07
Nodes (67): isProviderId(), dispatchInput(), replaceInContentEditable(), replaceInTextControl(), replaceSelection(), tryInsertText(), tryPaste(), deepActiveElement() (+59 more)

### Community 2 - "inputs.stories.tsx"
Cohesion: 0.18
Nodes (14): CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select(), StatusChip() (+6 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "contract.ts"
Cohesion: 0.06
Nodes (72): app, jwt(), userToken(), detectController(), fixGrammarController(), rewriteController(), getSettings(), putSettings() (+64 more)

### Community 5 - "background.ts"
Cohesion: 0.13
Nodes (30): RFC-7636, ApiError, call(), detect(), fixGrammar(), getSettings(), rewrite(), saveSettings() (+22 more)

### Community 6 - "AI Translator API README"
Cohesion: 0.08
Nodes (27): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+19 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.12
Nodes (20): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+12 more)

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
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "TranslatorWidget.stories.tsx"
Cohesion: 0.08
Nodes (22): Busy, Error, FAVORITES, FieldIcon, FieldIconChecking, FieldIconClean, FieldIconError, FieldIconErrors (+14 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "typography.stories.tsx"
Cohesion: 0.22
Nodes (10): Colours, meta, Scale, TONES, Text(), TEXT_TONE, TextTone, TextVariant (+2 more)

### Community 15 - "TranslatorWidget.tsx"
Cohesion: 0.15
Nodes (10): Anchor, clamp(), cornerStyle(), iconStyle(), Panel(), TranslatorWidget(), TranslatorWidgetProps, Trigger() (+2 more)

### Community 16 - "buttons.tsx"
Cohesion: 0.14
Nodes (15): ICON_SIZE, ICON_TONE, IconButton(), IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT (+7 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, happy-dom, storybook, @storybook/react-vite, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+4 more)

### Community 18 - "icons.tsx"
Cohesion: 0.06
Nodes (33): LANG_FLAG, PATHS, ref_flag_icons_flags_4x3_arab_svg_raw, ref_flag_icons_flags_4x3_bg_svg_raw, ref_flag_icons_flags_4x3_cn_svg_raw, ref_flag_icons_flags_4x3_cz_svg_raw, ref_flag_icons_flags_4x3_de_svg_raw, ref_flag_icons_flags_4x3_dk_svg_raw (+25 more)

### Community 19 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, noUncheckedIndexedAccess, strict, extends, ./.wxt/tsconfig.json

### Community 20 - "imports"
Cohesion: 0.40
Nodes (4): imports, hono, openai, postgres

### Community 21 - "OptionsPage.stories.tsx"
Cohesion: 0.08
Nodes (21): ProviderId, PROVIDERS, browserLanguages(), findLanguage(), colorScheme, Options(), OptionsPage(), OptionsPageProps (+13 more)

### Community 22 - "Extension Icon 128px (translation speech bubbles)"
Cohesion: 0.60
Nodes (5): Extension Icon 128px (translation speech bubbles), Extension Icon 16px, Extension Icon 32px, Extension Icon 48px, Translate Icon SVG (blue source bubble, yellow target bubble with A)

### Community 23 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build-storybook, compile, deploy, deploy:check, dev, dev:playground (+5 more)

### Community 26 - "icons.stories.tsx"
Cohesion: 0.20
Nodes (10): LANGUAGES, BrandMark(), fixed(), Flag(), Icon(), ICON_NAMES, Brand, Flags (+2 more)

### Community 27 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, flag-icons, @heroui/react, @heroui/styles, react, react-dom

### Community 28 - "@storybook/react-vite"
Cohesion: 0.33
Nodes (4): config, @storybook/react-vite, @tailwindcss/vite, wxt

### Community 30 - "WidgetCallbacks"
Cohesion: 0.25
Nodes (3): fixedText(), PanelBody(), WidgetCallbacks

### Community 31 - "translator-widget.ts"
Cohesion: 0.33
Nodes (7): remToPx(), withPropertyDefaults(), mountTranslator(), main(), ref_react_dom_client, ref_ui_theme_css_inline, ref_wxt_utils_define_content_script

## Knowledge Gaps
- **209 isolated node(s):** `hono`, `openai`, `postgres`, `DEV_JWT_SECRET`, `ASYMMETRIC` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 291 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `buttons.tsx` to `Translator.tsx`, `inputs.stories.tsx`, `extension/package.json`, `typography.stories.tsx`, `TranslatorWidget.tsx`, `icons.tsx`, `OptionsPage.stories.tsx`, `translator-widget.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `hono` connect `contract.ts` to `api/package.json`, `controllers/fix-grammar.ts`, `dev-gateway.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `@storybook/react-vite` connect `@storybook/react-vite` to `inputs.stories.tsx`, `extension/package.json`, `TranslatorWidget.stories.tsx`, `typography.stories.tsx`, `buttons.tsx`, `OptionsPage.stories.tsx`, `icons.stories.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `Translator()` (e.g. with `reducer()` and `subscribeDark()`) actually correct?**
  _`Translator()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Translator.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07382091592617908 - nodes in this community are weakly interconnected._
- **Should `graphify skill (SKILL.md)` be split into smaller, more focused modules?**
  _Cohesion score 0.0613107822410148 - nodes in this community are weakly interconnected._