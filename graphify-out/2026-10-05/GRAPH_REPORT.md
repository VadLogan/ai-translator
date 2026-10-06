# Graph Report - ai-translator-ext  (2026-10-05)

## Corpus Check
- 229 files · ~113,353 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1376 nodes · 3601 edges · 74 communities (63 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 186 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5842e39`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- background.ts
- TranslatorWidget.stories.tsx
- useTranslatorFlow.ts
- graphify skill (SKILL.md)
- selection.ts
- useTranslatorFlow
- fail
- dev-jwt.ts
- contract.ts
- client.ts
- scripts
- extension/package.json
- SettingsApp.tsx
- compilerOptions
- Session1.stories.tsx
- ToolbarPopup.tsx
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
- Home.tsx
- SettingsPageProps
- app.test.ts
- 4. Client-side product logic (portable)
- controllers/detect.ts
- AI Translator API README
- History.stories.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- react
- TranslatorWidget.tsx
- History.tsx
- ref_vitest
- WidgetCallbacks
- controllers/rewrite.ts
- messages.ts
- oauth.ts
- Demo
- Extension Release
- app.ts
- Frontend (client as an abstract unit)
- API architecture rules
- 4. Messaging protocol
- useActiveSite.ts
- fix-grammar/fix-grammar.ts
- Chrome extension
- usePageEvents
- visibleEdits
- SettingsPage.stories.tsx
- CLAUDE.md
- replace.ts
- VocabException
- chunkRequests.test.ts
- SettingsPage.tsx
- AI Translator: system overview
- API
- switchLayout
- controllers/transcribe.ts
- utils/exceptions.ts
- Languages.stories.tsx
- 7.1 In-page widget (`widgets/translator/`)
- @storybook/react-vite
- inventory.sh
- useSiteGate

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 104 edges
2. `react` - 43 edges
3. `sendMessage()` - 31 edges
4. `scopedLogger()` - 25 edges
5. `fail()` - 25 edges
6. `wholeField()` - 23 edges
7. `4. Client-side product logic (portable)` - 23 edges
8. `Icon()` - 21 edges
9. `HomeProps` - 21 edges
10. `requestId()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `5. Findings worth acting on before separating` --references--> `scopedLogger()`  [INFERRED]
  docs/README.md → api/src/resources/logger.ts
- `9. What is extension-only (would not carry to another client)` --references--> `fieldKey()`  [INFERRED]
  docs/extension.md → extension/src/content/selection.ts
- `1. Responsibilities` --references--> `switchLayout()`  [INFERRED]
  docs/api.md → extension/src/core/layout.ts
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `3.6 Settings` --references--> `Settings`  [INFERRED]
  docs/frontend.md → shared/contract.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (74 total, 11 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.20
Nodes (22): ApiError, call(), check(), detect(), fixGrammar(), getSettings(), reportDictation(), rewrite() (+14 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.04
Nodes (46): Busy, DictationTranslated, Error, estimate, Exception, FAVORITES, FieldIcon, FieldIconChecking (+38 more)

### Community 2 - "useTranslatorFlow.ts"
Cohesion: 0.10
Nodes (49): isProviderId(), Badge, EditableSelection, applyEdits(), findLanguage(), extension_src_core_languages_language, pairFor(), extension_src_widgets_translator_chunks_cleanfix (+41 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "selection.ts"
Cohesion: 0.15
Nodes (26): caretIn(), InsertMessage, caretIn(), deepActiveElement(), EXCLUDED_INPUT_MODES, fieldKey(), fieldLabel(), findContentEditableHost() (+18 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.12
Nodes (54): Rules, replaceSelection(), getFieldAnchor(), isSelectionUnchanged(), partOf(), wholeField(), sendMessage(), useTranslatorFlow() (+46 more)

### Community 6 - "fail"
Cohesion: 0.22
Nodes (14): voiceSessionController(), requireUser(), userIdFrom(), validate(), hits, isRateLimited(), rateLimit, voiceSession() (+6 more)

### Community 7 - "dev-jwt.ts"
Cohesion: 0.05
Nodes (40): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+32 more)

### Community 8 - "contract.ts"
Cohesion: 0.15
Nodes (22): isForm(), parseDetectBody(), parseExceptions(), parseFixGrammarBody(), parseRewriteBody(), parseTranslateBody(), DictationBody, EXCEPTION_KINDS (+14 more)

### Community 9 - "client.ts"
Cohesion: 0.17
Nodes (16): checkController(), client, LIVE_TRANSCRIBE_MODEL, TRANSCRIBE_MODEL, typeSafeClient, DICTATION_PROMPT, COUNTS, grammarQuality() (+8 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "SettingsApp.tsx"
Cohesion: 0.29
Nodes (9): useAccount(), useDisabledFields(), subscribe(), useHash(), useMicPermission(), useShortcuts(), useVocabulary(), SettingsApp() (+1 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Session1.stories.tsx"
Cohesion: 0.07
Nodes (16): CALLBACKS, DICTATION, DictationGrammar, DictationTranslation, FAVORITES, GRAMMAR, HistoryVoiceSign, meta (+8 more)

### Community 15 - "ToolbarPopup.tsx"
Cohesion: 0.06
Nodes (40): 7.3 Toolbar popup (`popups/toolbar/`), liveLanguage(), isVoiceLevel(), useActiveSite(), useDictation(), editKey(), useGrammarFix(), useHistory() (+32 more)

### Community 16 - "Trigger.tsx"
Cohesion: 0.25
Nodes (12): CountBadge(), Anchor, clamp(), cornerStyle(), ICON_SIZE, iconStyle(), panelPosition(), Size (+4 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, happy-dom, storybook, @storybook/react-vite, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+4 more)

### Community 18 - "icons.tsx"
Cohesion: 0.06
Nodes (35): BrandMark(), fixed(), LANG_FLAG, PATHS, ref_flag_icons_flags_4x3_arab_svg_raw, ref_flag_icons_flags_4x3_bg_svg_raw, ref_flag_icons_flags_4x3_cn_svg_raw, ref_flag_icons_flags_4x3_cz_svg_raw (+27 more)

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

### Community 30 - "Home.tsx"
Cohesion: 0.13
Nodes (18): ICON_SIZE, ICON_TONE, IconButton(), IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT (+10 more)

### Community 31 - "SettingsPageProps"
Cohesion: 0.14
Nodes (5): MicState, AccountSection(), FieldsSection(), SettingsPageProps, SitesSection()

### Community 32 - "app.test.ts"
Cohesion: 0.13
Nodes (16): jwt(), userToken(), translateController(), request, toRow(), TranslationRecord, translationsRepository, Counter (+8 more)

### Community 33 - "4. Client-side product logic (portable)"
Cohesion: 0.17
Nodes (20): 3.2 Grammar (badge → underlines → panel), 4. Client-side product logic (portable), Chunk, cleanFix(), escapeHtml(), isFinished(), mergeFixes(), withoutFixEdit() (+12 more)

### Community 34 - "controllers/detect.ts"
Cohesion: 0.80
Nodes (3): DetectionRecord, detectionsRepository, DetectBody

### Community 35 - "AI Translator API README"
Cohesion: 0.10
Nodes (21): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+13 more)

### Community 36 - "History.stories.tsx"
Cohesion: 0.18
Nodes (10): WidgetDictationTranslation(), WidgetRecording(), HISTORY, noop(), now, Default, Empty, meta (+2 more)

### Community 39 - "react"
Cohesion: 0.17
Nodes (15): CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select(), StatusChip() (+7 more)

### Community 40 - "TranslatorWidget.tsx"
Cohesion: 0.10
Nodes (30): PillButton(), fixedText(), GrammarPanel(), GrammarView, keptWords(), IconName, Divider(), Item() (+22 more)

### Community 41 - "History.tsx"
Cohesion: 0.12
Nodes (18): Icon(), Group(), Row(), SubHeader(), Colours, meta, Scale, TONES (+10 more)

### Community 42 - "ref_vitest"
Cohesion: 0.07
Nodes (25): request, toRow(), request, toRow(), request, toRow(), create, diff() (+17 more)

### Community 44 - "controllers/rewrite.ts"
Cohesion: 0.40
Nodes (7): rewriteController(), RewriteRecord, rewritesRepository, rewrite(), STYLE, RewriteBody, RewriteOk

### Community 45 - "messages.ts"
Cohesion: 0.20
Nodes (15): 5. Endpoints, Errors, Route details, Summary, Validation (`middleware/body.ts`), 4.1 UI → worker (`messaging/messages.ts`), ProviderId, Account (+7 more)

### Community 46 - "oauth.ts"
Cohesion: 0.26
Nodes (12): RFC-7636, base64url(), challengeFor(), createVerifier(), getAccessToken(), isExpired(), signIn(), store() (+4 more)

### Community 47 - "Demo"
Cohesion: 0.33
Nodes (5): 1. Collect the session's changes, 2. Pick the next file, 4. Build, 5. Show, Demo

### Community 48 - "Extension Release"
Cohesion: 0.22
Nodes (8): 1. Find the baseline, 2. Understand the differences, 3. Propose the bump, 4. Update the description, 5. Write the changes, 6. Report, Extension Release, Where things live (WXT project)

### Community 49 - "app.ts"
Cohesion: 0.13
Nodes (15): app, getSettings(), putSettings(), statsController(), env(), get(), parseDictationBody(), parseSettings() (+7 more)

### Community 50 - "Frontend (client as an abstract unit)"
Cohesion: 0.14
Nodes (14): 2. Contract usage, 3.1 Translate, 3.3 Wrong keyboard layout / gibberish, 3.4 Voice input, 3.5 Auth, 3.6 Settings, 3. Core flows (platform-agnostic), 5. Client-owned data (+6 more)

### Community 51 - "API architecture rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

### Community 52 - "4. Messaging protocol"
Cohesion: 0.50
Nodes (4): 4.2 Worker ↔ offscreen recorder (`messaging/recorder.ts`), 4.3 Popup → content script, 4. Messaging protocol, stop()

### Community 53 - "useActiveSite.ts"
Cohesion: 0.17
Nodes (12): 2. Manifest, isSiteDisabled(), parseSites(), useSettings(), activeTab(), Tab, DisabledField, disabledFields (+4 more)

### Community 54 - "fix-grammar/fix-grammar.ts"
Cohesion: 0.18
Nodes (16): fixGrammarController(), dictationController(), guardText, CorrectionRecord, correctionsRepository, fixGrammar(), applyEdits(), validateGuard() (+8 more)

### Community 55 - "Chrome extension"
Cohesion: 0.22
Nodes (9): 1. Runtime contexts, 3. Source layout, 5. Browser / Web APIs used, 6. Storage (`chrome.storage.local`), 8. Development, testing, release, 9. What is extension-only (would not carry to another client), Chrome extension, Dependency rules (+1 more)

### Community 57 - "visibleEdits"
Cohesion: 0.30
Nodes (10): 7.2 DOM layer (`content/`), inside(), rangeAt(), rangeRects(), textControlRects(), fixDictation(), measure(), useUnderlines() (+2 more)

### Community 58 - "SettingsPage.stories.tsx"
Cohesion: 0.14
Nodes (12): PROVIDERS, SettingsPage(), Loading, meta, MicBlocked, MicRequested, NothingTurnedOff, Saved (+4 more)

### Community 59 - "CLAUDE.md"
Cohesion: 0.20
Nodes (8): Typed background-worker messaging protocol, Closed shadow-root translator widget, Extension is frontend only, Layered API architecture, Paste-first selection replacement, Constraints that outrank tidiness, Extension UI (`extension/src/`), AI Translator playground page

### Community 60 - "replace.ts"
Cohesion: 0.47
Nodes (8): bareLink(), dispatchInput(), isLink(), replaceInContentEditable(), replaceInTextControl(), tryInsertText(), tryPaste(), withAtoms()

### Community 61 - "VocabException"
Cohesion: 0.06
Nodes (34): 1. Collect two inputs, 2. Route each fact to one home, 3. Edit, 4. Verify and report, Common mistakes, Update project docs, darkQuery(), followColorScheme() (+26 more)

### Community 62 - "chunkRequests.test.ts"
Cohesion: 0.24
Nodes (7): Response, ChunkRequests, drop(), pump(), use(), isVerdict(), Verdict

### Community 63 - "SettingsPage.tsx"
Cohesion: 0.12
Nodes (18): Flag(), ICON_NAMES, Brand, Flags, Interface, meta, browserLanguages(), extension_src_core_languages_languages (+10 more)

### Community 64 - "AI Translator: system overview"
Cohesion: 0.22
Nodes (6): 1. What the product does, 2. System map, 3. Responsibility split (target state), 4. Repository layout, 5. Findings worth acting on before separating, AI Translator: system overview

### Community 65 - "API"
Cohesion: 0.25
Nodes (8): 10. Testing, 1. Responsibilities, 2. Runtime and deployment, 4. External services, 6. Authentication and authorisation, 7. Cross-cutting, 9. Configuration, API

### Community 66 - "switchLayout"
Cohesion: 0.33
Nodes (6): isCyrillic(), layoutLanguages(), RUSSIAN_ONLY, switchLayout(), toCyrillic, toLatin

### Community 67 - "controllers/transcribe.ts"
Cohesion: 0.26
Nodes (11): detectController(), transcribeController(), audio, toRow(), TranscriptionRecord, transcriptionsRepository, detectLang(), transcribe() (+3 more)

### Community 68 - "utils/exceptions.ts"
Cohesion: 0.40
Nodes (6): ExceptionKind, ExceptionHit, exceptionOf(), findExceptions(), SIMILAR, similarity()

### Community 69 - "Languages.stories.tsx"
Cohesion: 0.25
Nodes (7): 3. Write `extension/src/demo/Session<N>.stories.tsx`, LATELY, PopupFrame(), From, Into, meta, Story

### Community 70 - "7.1 In-page widget (`widgets/translator/`)"
Cohesion: 0.29
Nodes (6): 8. Data model (`supabase/migrations/`), 7.1 In-page widget (`widgets/translator/`), 7.4 Settings page (`popups/settings/`, served as `options.html`), 7.5 Voice pipeline (extension specifics), 7. UI surfaces, grammar()

## Knowledge Gaps
- **348 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+343 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 495 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `API architecture rules` connect `API architecture rules` to `AI Translator: system overview`, `CLAUDE.md`, `graphify skill (SKILL.md)`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `API` connect `API` to `AI Translator: system overview`, `7.1 In-page widget (`widgets/translator/`)`, `fail`, `ref_vitest`, `messages.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `TranslatorWidget.stories.tsx`, `useTranslatorFlow.ts`, `extension/package.json`, `SettingsApp.tsx`, `Session1.stories.tsx`, `ToolbarPopup.tsx`, `Trigger.tsx`, `icons.tsx`, `Home.tsx`, `4. Client-side product logic (portable)`, `TranslatorWidget.tsx`, `History.tsx`, `messages.ts`, `useActiveSite.ts`, `usePageEvents`, `visibleEdits`, `VocabException`, `SettingsPage.tsx`, `Languages.stories.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `useTranslatorFlow()` (e.g. with `7.1 In-page widget (`widgets/translator/`)` and `closeSuggestion()`) actually correct?**
  _`useTranslatorFlow()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `sendMessage()` (e.g. with `Rules` and `Dependency rules`) actually correct?**
  _`sendMessage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `scopedLogger()` (e.g. with `3. Internal architecture` and `5. Findings worth acting on before separating`) actually correct?**
  _`scopedLogger()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _348 weakly-connected nodes found - possible documentation gaps or missing edges._