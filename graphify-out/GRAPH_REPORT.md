# Graph Report - grammar-widget-pending-893c08  (2026-10-02)

## Corpus Check
- 214 files · ~105,702 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .example 2, .css 1)

## Summary
- 1296 nodes · 3304 edges · 65 communities (56 shown, 9 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 184 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59142024`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- background.ts
- TranslatorWidget.stories.tsx
- ToolbarPopup.tsx
- graphify skill (SKILL.md)
- scopedLogger
- useTranslatorFlow
- Translator.tsx
- dev-gateway.ts
- contract.ts
- app.test.ts
- scripts
- extension/package.json
- OptionsPage.stories.tsx
- compilerOptions
- Session1.stories.tsx
- usePageEvents
- Trigger.tsx
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
- selection.ts
- chunks.test.ts
- db.ts
- useTranslatorFlow.ts
- CLAUDE.md
- AI Translator API README
- Languages.stories.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- Home.tsx
- LanguagesPanel.tsx
- typography.tsx
- ref_vitest
- TranslatorWidget.tsx
- inputs.tsx
- languages.ts
- 7.1 In-page widget (`widgets/translator/`)
- Demo
- Extension Release
- TranslatorWidget
- controllers/translate.ts
- API architecture rules
- OptionsApp.tsx
- RequestSlot
- app.ts
- History.stories.tsx
- visibleEdits
- toEdits.ts
- API
- fix-grammar/fix-grammar.ts
- replace.ts
- switchLayout
- chunkRequests.test.ts
- fromSegments.ts
- inventory.sh

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 99 edges
2. `react` - 33 edges
3. `sendMessage()` - 29 edges
4. `scopedLogger()` - 25 edges
5. `fail()` - 25 edges
6. `wholeField()` - 23 edges
7. `4. Client-side product logic (portable)` - 23 edges
8. `HomeProps` - 21 edges
9. `requestId()` - 20 edges
10. `findLanguage()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `5. Findings worth acting on before separating` --references--> `scopedLogger()`  [INFERRED]
  docs/README.md → api/src/resources/logger.ts
- `9. What is extension-only (would not carry to another client)` --references--> `fieldKey()`  [INFERRED]
  docs/extension.md → extension/src/content/selection.ts
- `1. Responsibilities` --references--> `switchLayout()`  [INFERRED]
  docs/api.md → extension/src/core/layout.ts
- `3. Write `extension/src/demo/Session<N>.stories.tsx`` --references--> `PopupFrame()`  [INFERRED]
  .claude/skills/demo/SKILL.md → extension/src/popups/toolbar/Popup.tsx
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (65 total, 9 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.07
Nodes (59): 1. Collect two inputs, 2. Route each fact to one home, 3. Edit, 4. Verify and report, Common mistakes, Update project docs, RFC-7636, 4.1 UI → worker (`messaging/messages.ts`) (+51 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.04
Nodes (43): Busy, DictationTranslated, Error, estimate, FieldIcon, FieldIconChecking, FieldIconClean, FieldIconError (+35 more)

### Community 2 - "ToolbarPopup.tsx"
Cohesion: 0.05
Nodes (49): 7.3 Toolbar popup (`popups/toolbar/`), 4. Client-side product logic (portable), StatusChip(), withoutFixEdit(), liveLanguage(), isVoiceLevel(), useDictation(), editKey() (+41 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "scopedLogger"
Cohesion: 0.25
Nodes (23): checkController(), detectController(), fixGrammarController(), rewriteController(), dictationController(), transcribeController(), translateController(), voiceSessionController() (+15 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.15
Nodes (44): isProviderId(), replaceSelection(), getFieldAnchor(), wholeField(), sendMessage(), useTranslatorFlow(), apply(), checkField() (+36 more)

### Community 6 - "Translator.tsx"
Cohesion: 0.15
Nodes (15): darkQuery(), followColorScheme(), subscribeDark(), usePrefersDark(), extension_src_components_theme, FlowOptions, mountTranslator(), remToPx() (+7 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.06
Nodes (40): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+32 more)

### Community 8 - "contract.ts"
Cohesion: 0.15
Nodes (21): parseDetectBody(), parseFixGrammarBody(), parseRewriteBody(), parseTranslateBody(), TranscriptionRecord, transcriptionsRepository, CheckBody, DictationBody (+13 more)

### Community 9 - "app.test.ts"
Cohesion: 0.13
Nodes (21): jwt(), userToken(), client, LIVE_TRANSCRIBE_MODEL, MODEL, TRANSCRIBE_MODEL, typeSafeClient, DICTATION_PROMPT (+13 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "OptionsPage.stories.tsx"
Cohesion: 0.15
Nodes (11): ProviderId, PROVIDERS, Failed, Loading, meta, MicRequested, Saved, Saving (+3 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Session1.stories.tsx"
Cohesion: 0.07
Nodes (15): CALLBACKS, DICTATION, DictationGrammar, DictationTranslation, GRAMMAR, HistoryVoiceSign, meta, OptionsMicrophone (+7 more)

### Community 16 - "Trigger.tsx"
Cohesion: 0.24
Nodes (12): Badge, CountBadge(), clamp(), cornerStyle(), ICON_SIZE, iconStyle(), panelPosition(), Size (+4 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, happy-dom, storybook, @storybook/react-vite, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+4 more)

### Community 18 - "icons.tsx"
Cohesion: 0.05
Nodes (41): BrandMark(), fixed(), ICON_NAMES, LANG_FLAG, PATHS, Brand, Flags, Interface (+33 more)

### Community 19 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, noUncheckedIndexedAccess, strict, extends, ./.wxt/tsconfig.json

### Community 20 - "imports"
Cohesion: 0.33
Nodes (5): imports, hono, openai, postgres, @typesafe-ai/sdk

### Community 21 - "offscreen/main.ts"
Cohesion: 0.16
Nodes (22): applyEvent(), emptyTranscript(), isComplete(), liveText(), LiveTranscript, ServerEvent, run(), toPcm16Base64() (+14 more)

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

### Community 30 - "selection.ts"
Cohesion: 0.14
Nodes (29): 7.2 DOM layer (`content/`), caretIn(), insertIntoFocusedField(), InsertMessage, caretIn(), deepActiveElement(), EXCLUDED_INPUT_MODES, fieldKey() (+21 more)

### Community 31 - "chunks.test.ts"
Cohesion: 0.14
Nodes (22): Chunk, cleanFix(), escapeHtml(), isFinished(), mergeFixes(), Ask, sentenceFixes(), sentences() (+14 more)

### Community 32 - "db.ts"
Cohesion: 0.14
Nodes (15): env(), get(), CorrectionRecord, correctionsRepository, DetectionRecord, detectionsRepository, profilesRepository, rows (+7 more)

### Community 33 - "useTranslatorFlow.ts"
Cohesion: 0.11
Nodes (43): Anchor, EditableSelection, plainText(), applyEdits(), extension_src_core_languages_language, DistributiveOmit, Action, answered() (+35 more)

### Community 34 - "CLAUDE.md"
Cohesion: 0.29
Nodes (6): Typed background-worker messaging protocol, Closed shadow-root translator widget, Extension is frontend only, Layered API architecture, Paste-first selection replacement, AI Translator playground page

### Community 35 - "AI Translator API README"
Cohesion: 0.10
Nodes (21): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+13 more)

### Community 36 - "Languages.stories.tsx"
Cohesion: 0.20
Nodes (9): WidgetDictationTranslation(), WidgetRecording(), LATELY, noop(), now, From, Into, meta (+1 more)

### Community 39 - "Home.tsx"
Cohesion: 0.15
Nodes (20): ICON_SIZE, ICON_TONE, IconButton(), IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT (+12 more)

### Community 40 - "LanguagesPanel.tsx"
Cohesion: 0.24
Nodes (10): Flag(), IconName, Divider(), Item(), Section(), Status(), Props, Translation (+2 more)

### Community 41 - "typography.tsx"
Cohesion: 0.23
Nodes (9): Colours, meta, Scale, TONES, TEXT_TONE, TextTone, TextVariant, VARIANT (+1 more)

### Community 42 - "ref_vitest"
Cohesion: 0.12
Nodes (11): request, toRow(), request, toRow(), request, toRow(), audio, toRow() (+3 more)

### Community 43 - "TranslatorWidget.tsx"
Cohesion: 0.12
Nodes (13): DictationBar(), Transcript(), LanguagesPanel(), BusyPanel(), ErrorPanel(), NotTextPanel(), SignInPanel(), Mark (+5 more)

### Community 44 - "inputs.tsx"
Cohesion: 0.18
Nodes (13): CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select(), Controls (+5 more)

### Community 45 - "languages.ts"
Cohesion: 0.15
Nodes (18): Group(), Row(), SubHeader(), browserLanguages(), findLanguage(), languageName(), nativeName(), searchLanguages() (+10 more)

### Community 46 - "7.1 In-page widget (`widgets/translator/`)"
Cohesion: 0.29
Nodes (6): 8. Data model (`supabase/migrations/`), 7.1 In-page widget (`widgets/translator/`), 7.4 Options page (`popups/options/`), 7.5 Voice pipeline (extension specifics), 7. UI surfaces, grammar()

### Community 47 - "Demo"
Cohesion: 0.29
Nodes (6): 1. Collect the session's changes, 2. Pick the next file, 3. Write `extension/src/demo/Session<N>.stories.tsx`, 4. Build, 5. Show, Demo

### Community 48 - "Extension Release"
Cohesion: 0.22
Nodes (8): 1. Find the baseline, 2. Understand the differences, 3. Propose the bump, 4. Update the description, 5. Write the changes, 6. Report, Extension Release, Where things live (WXT project)

### Community 49 - "TranslatorWidget"
Cohesion: 0.29
Nodes (6): Constraints that outrank tidiness, Extension UI (`extension/src/`), Rules, 3. Source layout, Dependency rules, TranslatorWidget()

### Community 50 - "controllers/translate.ts"
Cohesion: 0.16
Nodes (10): TranslationRecord, translationsRepository, Counter, ModelUse, WordStats, wordStatsRepository, ref_node_fs, ref_node_os (+2 more)

### Community 51 - "API architecture rules"
Cohesion: 0.06
Nodes (39): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+31 more)

### Community 52 - "OptionsApp.tsx"
Cohesion: 0.09
Nodes (24): 1. Runtime contexts, 2. Manifest, 5. Browser / Web APIs used, 6. Storage (`chrome.storage.local`), 8. Development, testing, release, 9. What is extension-only (would not carry to another client), Chrome extension, isSiteDisabled() (+16 more)

### Community 54 - "app.ts"
Cohesion: 0.13
Nodes (15): app, getSettings(), putSettings(), statsController(), requireUser(), userIdFrom(), parseDictationBody(), parseSettings() (+7 more)

### Community 55 - "History.stories.tsx"
Cohesion: 0.20
Nodes (8): HISTORY, Default, Empty, meta, Story, Undo, config, @storybook/react-vite

### Community 57 - "visibleEdits"
Cohesion: 0.38
Nodes (8): inside(), rangeRects(), textControlRects(), openSuggestion(), measure(), useUnderlines(), showsUnderlines(), visibleEdits()

### Community 58 - "toEdits.ts"
Cohesion: 0.19
Nodes (13): diff(), ModelEdit, overlaps(), Span, edits(), toEdits(), tokenize(), 11. Client-facing coupling to remove when separating (+5 more)

### Community 59 - "API"
Cohesion: 0.17
Nodes (12): 10. Testing, 1. Responsibilities, 2. Runtime and deployment, 4. External services, 5. Endpoints, 6. Authentication and authorisation, 7. Cross-cutting, 9. Configuration (+4 more)

### Community 61 - "fix-grammar/fix-grammar.ts"
Cohesion: 0.39
Nodes (4): fixGrammar(), applyEdits(), editSegments(), FIX_KINDS

### Community 62 - "replace.ts"
Cohesion: 0.40
Nodes (9): bareLink(), dispatchInput(), isLink(), replaceInContentEditable(), replaceInTextControl(), tryInsertText(), tryPaste(), withAtoms() (+1 more)

### Community 63 - "switchLayout"
Cohesion: 0.33
Nodes (6): isCyrillic(), layoutLanguages(), RUSSIAN_ONLY, switchLayout(), toCyrillic, toLatin

### Community 65 - "chunkRequests.test.ts"
Cohesion: 0.27
Nodes (6): Response, ChunkRequests, drop(), pump(), use(), isVerdict()

### Community 66 - "fromSegments.ts"
Cohesion: 0.48
Nodes (3): Segment, escapeHtml(), fromSegments()

## Knowledge Gaps
- **339 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+334 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 477 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `API` connect `API` to `toEdits.ts`, `API architecture rules`, `scopedLogger`, `7.1 In-page widget (`widgets/translator/`)`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `react` connect `ToolbarPopup.tsx` to `useTranslatorFlow.ts`, `TranslatorWidget.stories.tsx`, `Translator.tsx`, `Home.tsx`, `LanguagesPanel.tsx`, `typography.tsx`, `extension/package.json`, `inputs.tsx`, `languages.ts`, `Session1.stories.tsx`, `usePageEvents`, `Trigger.tsx`, `TranslatorWidget.tsx`, `icons.tsx`, `OptionsApp.tsx`, `visibleEdits`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `API architecture rules` connect `API architecture rules` to `CLAUDE.md`, `graphify skill (SKILL.md)`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `useTranslatorFlow()` (e.g. with `7.1 In-page widget (`widgets/translator/`)` and `closeSuggestion()`) actually correct?**
  _`useTranslatorFlow()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `sendMessage()` (e.g. with `Rules` and `Dependency rules`) actually correct?**
  _`sendMessage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `scopedLogger()` (e.g. with `3. Internal architecture` and `5. Findings worth acting on before separating`) actually correct?**
  _`scopedLogger()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _339 weakly-connected nodes found - possible documentation gaps or missing edges._