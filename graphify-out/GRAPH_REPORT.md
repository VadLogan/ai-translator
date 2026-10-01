# Graph Report - ai-translator-ext  (2026-10-01)

## Corpus Check
- 207 files · ~95,258 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1220 nodes · 3131 edges · 58 communities (49 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `96ab156e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- background.ts
- TranslatorWidget.stories.tsx
- ToolbarPopup.tsx
- graphify skill (SKILL.md)
- fail
- useTranslatorFlow
- Translator.tsx
- dev-gateway.ts
- contract.ts
- client.ts
- scripts
- extension/package.json
- messages.ts
- compilerOptions
- Session1.stories.tsx
- usePageEvents
- TranslatorWidget.tsx
- devDependencies
- icons.tsx
- compilerOptions
- imports
- offscreen/main.ts
- Extension Icon 128px (translation speech bubbles)
- scripts
- Extension id pinning for OAuth redirect
- vitest.config.ts
- @tailwindcss/vite
- dependencies
- Home.stories.tsx
- ref_src_health_ts
- translations.ts
- Languages.stories.tsx
- app.test.ts
- useTranslatorFlow.ts
- TranslatorWidget
- API architecture rules
- History.stories.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- Icon
- controllers/transcribe.ts
- react
- ref_vitest
- buttons.tsx
- Home.tsx
- WidgetCallbacks
- Demo
- Extension Release
- db.ts
- wordStats.ts
- controllers/rewrite.ts
- api/package.json
- app.ts
- @storybook/react-vite
- dev-jwt.ts
- devDependencies
- Languages
- scripts

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 98 edges
2. `react` - 33 edges
3. `sendMessage()` - 28 edges
4. `fail()` - 24 edges
5. `scopedLogger()` - 23 edges
6. `wholeField()` - 23 edges
7. `HomeProps` - 21 edges
8. `findLanguage()` - 20 edges
9. `HistoryEntry` - 20 edges
10. `requestId()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `3. Write `extension/src/demo/Session<N>.stories.tsx`` --references--> `PopupFrame()`  [INFERRED]
  .claude/skills/demo/SKILL.md → extension/src/popups/toolbar/Popup.tsx
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `Rules` --references--> `sendMessage()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/messaging/messages.ts
- `Rules` --references--> `TranslatorWidget()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/TranslatorWidget.tsx
- `CorrectionRecord` --references--> `FixGrammarOk`  [EXTRACTED]
  api/src/repositories/corrections.ts → shared/contract.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (58 total, 9 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.12
Nodes (35): RFC-7636, ApiError, call(), check(), detect(), fixGrammar(), getSettings(), reportDictation() (+27 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.04
Nodes (44): Busy, DictationTranslated, Error, estimate, FAVORITES, FieldIcon, FieldIconChecking, FieldIconClean (+36 more)

### Community 2 - "ToolbarPopup.tsx"
Cohesion: 0.06
Nodes (32): editKey(), useGrammarFix(), useHistory(), usePinned(), Notice, Options, useTranslation(), EntryActions (+24 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "fail"
Cohesion: 0.25
Nodes (21): checkController(), detectController(), fixGrammarController(), rewriteController(), dictationController(), transcribeController(), translateController(), voiceSessionController() (+13 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.07
Nodes (87): isProviderId(), caretIn(), insertIntoFocusedField(), InsertMessage, bareLink(), dispatchInput(), isLink(), replaceInContentEditable() (+79 more)

### Community 6 - "Translator.tsx"
Cohesion: 0.12
Nodes (19): darkQuery(), followColorScheme(), subscribeDark(), usePrefersDark(), extension_src_components_theme, isInsertMessage(), main(), FlowOptions (+11 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.24
Nodes (6): devToken(), gateway, token(), signJwt(), port, @hono/node-server

### Community 8 - "contract.ts"
Cohesion: 0.15
Nodes (20): rows, ResponseMap, settingsItem, CheckBody, CheckOk, DEFAULT_SETTINGS, DictationBody, HOSTNAME (+12 more)

### Community 9 - "client.ts"
Cohesion: 0.20
Nodes (13): client, LIVE_TRANSCRIBE_MODEL, TRANSCRIBE_MODEL, typeSafeClient, COUNTS, grammarQuality(), transcribe(), GuardVerdict (+5 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "messages.ts"
Cohesion: 0.06
Nodes (38): ProviderId, PROVIDERS, ICON_NAMES, Brand, Flags, Interface, meta, extension_src_core_languages_languages (+30 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Session1.stories.tsx"
Cohesion: 0.07
Nodes (16): CALLBACKS, DICTATION, DictationGrammar, DictationTranslation, FAVORITES, GRAMMAR, HistoryVoiceSign, meta (+8 more)

### Community 16 - "TranslatorWidget.tsx"
Cohesion: 0.17
Nodes (19): Anchor, BusyPanel(), ErrorPanel(), NotTextPanel(), SignInPanel(), Mark, Underlines(), clamp() (+11 more)

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

### Community 21 - "offscreen/main.ts"
Cohesion: 0.11
Nodes (26): liveLanguage(), applyEvent(), emptyTranscript(), isComplete(), liveText(), LiveTranscript, ServerEvent, run() (+18 more)

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
Cohesion: 0.14
Nodes (13): Busy, Default, DictatedGrammar, Empty, Error, Listening, meta, OnePair (+5 more)

### Community 30 - "translations.ts"
Cohesion: 0.33
Nodes (7): TranslationRecord, translationsRepository, MODEL, createInput(), translate(), TranslateBody, TranslateOk

### Community 31 - "Languages.stories.tsx"
Cohesion: 0.29
Nodes (6): LATELY, PopupFrame(), From, Into, meta, Story

### Community 32 - "app.test.ts"
Cohesion: 0.18
Nodes (12): jwt(), userToken(), CorrectionRecord, correctionsRepository, request, toRow(), DetectionRecord, detectionsRepository (+4 more)

### Community 33 - "useTranslatorFlow.ts"
Cohesion: 0.05
Nodes (87): EditableSelection, rangeRects(), applyEdits(), Chunk, cleanFix(), escapeHtml(), isFinished(), mergeFixes() (+79 more)

### Community 34 - "TranslatorWidget"
Cohesion: 0.40
Nodes (4): Constraints that outrank tidiness, Extension UI (`extension/src/`), Rules, TranslatorWidget()

### Community 35 - "API architecture rules"
Cohesion: 0.06
Nodes (46): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+38 more)

### Community 36 - "History.stories.tsx"
Cohesion: 0.18
Nodes (10): WidgetDictationTranslation(), WidgetRecording(), HISTORY, noop(), now, Default, Empty, meta (+2 more)

### Community 39 - "Icon"
Cohesion: 0.18
Nodes (8): Icon, meta, Pill, Badge, CountBadge(), BrandMark(), fixed(), Icon()

### Community 40 - "controllers/transcribe.ts"
Cohesion: 0.42
Nodes (6): audio, toRow(), TranscriptionRecord, transcriptionsRepository, TranscribeBody, TranscribeOk

### Community 41 - "react"
Cohesion: 0.14
Nodes (18): Group(), Row(), SubHeader(), Colours, meta, Scale, TONES, Text() (+10 more)

### Community 42 - "ref_vitest"
Cohesion: 0.10
Nodes (22): request, toRow(), request, toRow(), request, toRow(), fixGrammar(), applyEdits() (+14 more)

### Community 43 - "buttons.tsx"
Cohesion: 0.10
Nodes (27): ICON_SIZE, ICON_TONE, IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT, PillButton() (+19 more)

### Community 44 - "Home.tsx"
Cohesion: 0.14
Nodes (20): IconButton(), CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select() (+12 more)

### Community 47 - "Demo"
Cohesion: 0.29
Nodes (6): 1. Collect the session's changes, 2. Pick the next file, 3. Write `extension/src/demo/Session<N>.stories.tsx`, 4. Build, 5. Show, Demo

### Community 48 - "Extension Release"
Cohesion: 0.22
Nodes (8): 1. Find the baseline, 2. Understand the differences, 3. Propose the bump, 4. Update the description, 5. Write the changes, 6. Report, Extension Release, Where things live (WXT project)

### Community 49 - "db.ts"
Cohesion: 0.31
Nodes (6): handler(), env(), get(), checkDb(), sql, ref_db_ts

### Community 50 - "wordStats.ts"
Cohesion: 0.20
Nodes (6): Counter, ModelUse, WordStats, ref_node_fs, ref_node_os, ref_node_path

### Community 51 - "controllers/rewrite.ts"
Cohesion: 0.44
Nodes (6): RewriteRecord, rewritesRepository, rewrite(), STYLE, RewriteBody, RewriteOk

### Community 53 - "api/package.json"
Cohesion: 0.20
Nodes (9): typescript, vitest, name, private, type, version, openai, postgres (+1 more)

### Community 54 - "app.ts"
Cohesion: 0.11
Nodes (20): app, getSettings(), putSettings(), statsController(), requireUser(), userIdFrom(), parseDetectBody(), parseDictationBody() (+12 more)

### Community 56 - "dev-jwt.ts"
Cohesion: 0.39
Nodes (8): ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey(), jwks(), verifyAsymmetric(), verifyJwt()

### Community 58 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, hono, @hono/node-server, openai, postgres, @types/node, @typesafe-ai/sdk, typescript (+1 more)

### Community 62 - "Languages"
Cohesion: 0.40
Nodes (3): ago(), Languages(), LanguagesProps

### Community 63 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, compile, dev, test, token

## Knowledge Gaps
- **308 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+303 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 445 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Rules` connect `TranslatorWidget` to `useTranslatorFlow`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `useTranslatorFlow.ts`, `ToolbarPopup.tsx`, `TranslatorWidget.stories.tsx`, `Translator.tsx`, `Icon`, `buttons.tsx`, `extension/package.json`, `Home.tsx`, `Session1.stories.tsx`, `messages.ts`, `usePageEvents`, `TranslatorWidget.tsx`, `icons.tsx`, `offscreen/main.ts`, `Languages.stories.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `useTranslatorFlow()` (e.g. with `closeSuggestion()` and `disableField()`) actually correct?**
  _`useTranslatorFlow()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _308 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12070874861572536 - nodes in this community are weakly interconnected._
- **Should `TranslatorWidget.stories.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `ToolbarPopup.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._