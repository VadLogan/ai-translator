# Graph Report - ai-translator-ext  (2026-09-29)

## Corpus Check
- 133 files · ~60,330 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 853 nodes · 1892 edges · 42 communities (38 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `726c0356`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_vitest
- Translator.tsx
- inputs.stories.tsx
- graphify skill (SKILL.md)
- contract.ts
- background.ts
- API architecture rules
- dev-gateway.ts
- typography.stories.tsx
- history.ts
- scripts
- extension/package.json
- TranslatorWidget.stories.tsx
- compilerOptions
- languages.ts
- TranslatorWidget.tsx
- buttons.tsx
- devDependencies
- icons.tsx
- compilerOptions
- imports
- WidgetCallbacks
- Extension Icon 128px (translation speech bubbles)
- scripts
- Extension id pinning for OAuth redirect
- vitest.config.ts
- @tailwindcss/vite
- dependencies
- icons.stories.tsx
- ref_src_health_ts
- options/main.tsx
- app.ts
- PopupProps
- selection.ts
- app.test.ts
- Popup.stories.tsx
- controllers/fix-grammar.ts
- popup/main.tsx
- controllers/detect.ts
- Popup.tsx
- controllers/translate.ts
- HistoryEntry

## God Nodes (most connected - your core abstractions)
1. `Translator()` - 54 edges
2. `PopupProps` - 24 edges
3. `fail()` - 20 edges
4. `graphify skill (SKILL.md)` - 19 edges
5. `findLanguage()` - 18 edges
6. `scopedLogger()` - 17 edges
7. `sendMessage()` - 16 edges
8. `requestId()` - 13 edges
9. `benchmark()` - 13 edges
10. `scripts` - 13 edges

## Surprising Connections (you probably didn't know these)
- `TranslationRecord` --references--> `TranslateOk`  [EXTRACTED]
  api/src/repositories/translations.ts → shared/contract.ts
- `Check` --references--> `FixGrammarOk`  [EXTRACTED]
  extension/src/content/ui/translator-state.ts → shared/contract.ts
- `OptionsPageProps` --references--> `Language`  [EXTRACTED]
  extension/src/entrypoints/options/OptionsPage.tsx → shared/contract.ts
- `ResponseMap` --references--> `CheckOk`  [EXTRACTED]
  extension/src/messaging/messages.ts → shared/contract.ts
- `ResponseMap` --references--> `DetectOk`  [EXTRACTED]
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

## Communities (42 total, 4 thin omitted)

### Community 0 - "ref_vitest"
Cohesion: 0.28
Nodes (6): diff(), Segment, escapeHtml(), fromSegments(), tokenize(), ref_vitest

### Community 1 - "Translator.tsx"
Cohesion: 0.08
Nodes (73): isProviderId(), EditableSelection, fieldKey(), fieldLabel(), getFieldAnchor(), isSelectionUnchanged(), plainText(), wholeField() (+65 more)

### Community 2 - "inputs.stories.tsx"
Cohesion: 0.16
Nodes (15): CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select(), StatusChip() (+7 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "contract.ts"
Cohesion: 0.10
Nodes (29): parseDetectBody(), parseRewriteBody(), parseSettings(), parseTranslateBody(), profilesRepository, rows, RewriteRecord, rewritesRepository (+21 more)

### Community 5 - "background.ts"
Cohesion: 0.14
Nodes (29): RFC-7636, ApiError, call(), check(), detect(), fixGrammar(), getSettings(), rewrite() (+21 more)

### Community 6 - "API architecture rules"
Cohesion: 0.06
Nodes (46): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+38 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.06
Nodes (42): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+34 more)

### Community 8 - "typography.stories.tsx"
Cohesion: 0.22
Nodes (10): Colours, meta, Scale, TONES, Text(), TEXT_TONE, TextTone, TextVariant (+2 more)

### Community 9 - "history.ts"
Cohesion: 0.20
Nodes (16): App(), History(), byDay(), byUse(), Common, defaultPair(), HISTORY_LIMIT, historyStore (+8 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "TranslatorWidget.stories.tsx"
Cohesion: 0.06
Nodes (28): Busy, Error, FieldIcon, FieldIconChecking, FieldIconClean, FieldIconError, FieldIconErrors, FieldIconGibberish (+20 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "languages.ts"
Cohesion: 0.22
Nodes (11): FAVORITES, browserLanguages(), findLanguage(), nativeName(), searchLanguages(), ago(), LanguageRow(), Languages() (+3 more)

### Community 15 - "TranslatorWidget.tsx"
Cohesion: 0.14
Nodes (11): Anchor, Badge, clamp(), cornerStyle(), iconStyle(), Panel(), TranslatorWidget(), TranslatorWidgetProps (+3 more)

### Community 16 - "buttons.tsx"
Cohesion: 0.15
Nodes (14): ICON_SIZE, ICON_TONE, IconButton(), IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT (+6 more)

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
Cohesion: 0.33
Nodes (5): imports, hono, openai, postgres, @typesafe-ai/sdk

### Community 21 - "WidgetCallbacks"
Cohesion: 0.22
Nodes (3): fixedText(), PanelBody(), WidgetCallbacks

### Community 22 - "Extension Icon 128px (translation speech bubbles)"
Cohesion: 0.60
Nodes (5): Extension Icon 128px (translation speech bubbles), Extension Icon 16px, Extension Icon 32px, Extension Icon 48px, Translate Icon SVG (blue source bubble, yellow target bubble with A)

### Community 23 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, build-storybook, compile, deploy, deploy:check, dev, dev:playground (+5 more)

### Community 27 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, flag-icons, @heroui/react, @heroui/styles, react, react-dom

### Community 28 - "icons.stories.tsx"
Cohesion: 0.15
Nodes (12): extension_src_core_languages_languages, BrandMark(), fixed(), Flag(), Icon(), ICON_NAMES, Brand, Flags (+4 more)

### Community 30 - "options/main.tsx"
Cohesion: 0.08
Nodes (19): OptionsPage(), OptionsPageProps, Failed, Loading, meta, Saved, Saving, SignedIn (+11 more)

### Community 31 - "app.ts"
Cohesion: 0.18
Nodes (22): checkController(), rewriteController(), getSettings(), putSettings(), requireUser(), userIdFrom(), validate(), guardText (+14 more)

### Community 32 - "PopupProps"
Cohesion: 0.16
Nodes (3): Home(), PopupProps, Pair

### Community 33 - "selection.ts"
Cohesion: 0.10
Nodes (37): caretIn(), insertIntoFocusedField(), InsertMessage, isInsertMessage(), dispatchInput(), replaceInContentEditable(), replaceInTextControl(), replaceSelection() (+29 more)

### Community 34 - "app.test.ts"
Cohesion: 0.15
Nodes (13): app, jwt(), userToken(), client, MODEL, typeSafeClient, COUNTS, STYLE (+5 more)

### Community 35 - "Popup.stories.tsx"
Cohesion: 0.11
Nodes (15): Busy, Empty, Error, History, HistoryEmpty, HistoryUndo, LanguagesFrom, LanguagesInto (+7 more)

### Community 36 - "controllers/fix-grammar.ts"
Cohesion: 0.21
Nodes (12): fixGrammarController(), CorrectionRecord, correctionsRepository, request, toRow(), fixGrammar(), consoleLogger, logger (+4 more)

### Community 37 - "popup/main.tsx"
Cohesion: 0.22
Nodes (10): ProviderId, PROVIDERS, isSiteDisabled(), parseSites(), Options(), activeTab(), Notice, Popup() (+2 more)

### Community 38 - "controllers/detect.ts"
Cohesion: 0.32
Nodes (8): detectController(), DetectionRecord, detectionsRepository, request, toRow(), detectLang(), DetectBody, DetectOk

### Community 39 - "Popup.tsx"
Cohesion: 0.20
Nodes (5): HistoryRow(), relative, time(), LANGUAGES, LANGUAGES_MAP

### Community 40 - "controllers/translate.ts"
Cohesion: 0.33
Nodes (7): translateController(), request, toRow(), TranslationRecord, translationsRepository, waitUntil(), TranslateBody

### Community 41 - "HistoryEntry"
Cohesion: 0.36
Nodes (3): HistoryCard(), HistoryEntry, TranslationEntry

## Knowledge Gaps
- **245 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 346 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `buttons.tsx` to `Translator.tsx`, `selection.ts`, `inputs.stories.tsx`, `popup/main.tsx`, `Popup.tsx`, `typography.stories.tsx`, `extension/package.json`, `TranslatorWidget.tsx`, `icons.tsx`, `options/main.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `@storybook/react-vite` connect `icons.stories.tsx` to `inputs.stories.tsx`, `Popup.stories.tsx`, `typography.stories.tsx`, `extension/package.json`, `TranslatorWidget.stories.tsx`, `buttons.tsx`, `options/main.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `hono` connect `app.ts` to `controllers/translate.ts`, `controllers/fix-grammar.ts`, `controllers/detect.ts`, `dev-gateway.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `Translator()` (e.g. with `reducer()` and `subscribeDark()`) actually correct?**
  _`Translator()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Translator.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0759493670886076 - nodes in this community are weakly interconnected._
- **Should `graphify skill (SKILL.md)` be split into smaller, more focused modules?**
  _Cohesion score 0.0613107822410148 - nodes in this community are weakly interconnected._