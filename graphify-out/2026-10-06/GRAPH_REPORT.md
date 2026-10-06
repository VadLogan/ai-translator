# Graph Report - ai-translator-ext  (2026-10-06)

## Corpus Check
- 259 files · ~130,822 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1657 nodes · 4333 edges · 84 communities (72 shown, 12 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 232 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5842e39`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- background.ts
- TranslatorWidget.stories.tsx
- translator/view.ts
- graphify skill (SKILL.md)
- meeting/state.ts
- useTranslatorFlow
- MeetingPanel.stories.tsx
- dev-gateway.ts
- contract.ts
- fix-grammar/fix-grammar.ts
- scripts
- extension/package.json
- translations.ts
- compilerOptions
- Session1.stories.tsx
- history.ts
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
- .storybook/main.ts
- dependencies
- Home.stories.tsx
- ref_src_health_ts
- buttons.tsx
- meetings.ts
- Session2.stories.tsx
- useTranslatorFlow.ts
- HomeProps
- AI Translator API README
- SettingsPage.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- react
- Session3.stories.tsx
- History.tsx
- toEdits.ts
- WidgetCallbacks
- Transcript.tsx
- chunkRequests.test.ts
- SettingsApp.tsx
- Demo
- Extension Release
- controllers/fix-grammar.ts
- Transcript.stories.tsx
- API architecture rules
- @storybook/react-vite
- HistoryEntry
- app.ts
- Rules
- SettingsPage.stories.tsx
- content.ts
- oauth.ts
- useMeetingDetail.ts
- usePageEvents
- selection.ts
- app.test.ts
- useActiveSite.ts
- db.ts
- transcript.ts
- ref_vitest
- messages.ts
- Home.tsx
- fixtures.ts
- app
- ref_db_ts
- inventory.sh
- AI Translator: system overview
- CLAUDE.md
- meeting/view.ts
- visibleEdits
- MeetingDetailProps
- ToolbarPopup.tsx
- replace.ts
- wordStats.ts
- 7.1 In-page widget (`widgets/translator/`)
- TranscriptDeps
- Chrome extension

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 107 edges
2. `react` - 50 edges
3. `sendMessage()` - 36 edges
4. `scopedLogger()` - 29 edges
5. `fail()` - 29 edges
6. `4. Client-side product logic (portable)` - 28 edges
7. `Icon()` - 26 edges
8. `requestId()` - 24 edges
9. `wholeField()` - 24 edges
10. `benchmark()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `5. Findings worth acting on before separating` --references--> `scopedLogger()`  [INFERRED]
  docs/README.md → api/src/resources/logger.ts
- `9. What is extension-only (would not carry to another client)` --references--> `fieldKey()`  [INFERRED]
  docs/extension.md → extension/src/content/selection.ts
- `1. Responsibilities` --references--> `switchLayout()`  [INFERRED]
  docs/api.md → extension/src/core/layout.ts
- `3. Write `extension/src/demo/Session<N>.stories.tsx`` --references--> `PopupFrame()`  [INFERRED]
  .claude/skills/demo/SKILL.md → extension/src/popups/toolbar/Popup.tsx
- `7.5 Meeting card (`widgets/meeting/`)` --references--> `mountMeeting()`  [INFERRED]
  docs/extension.md → extension/src/widgets/meeting/mount.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (84 total, 12 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.18
Nodes (25): ApiError, call(), check(), detect(), explain(), fixGrammar(), getSettings(), reportDictation() (+17 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.04
Nodes (46): Busy, DictationTranslated, Error, estimate, Exception, FAVORITES, FieldIcon, FieldIconChecking (+38 more)

### Community 2 - "translator/view.ts"
Cohesion: 0.14
Nodes (32): EditableSelection, findLanguage(), extension_src_core_languages_language, Action, answered(), badge(), Check, cleanCheck() (+24 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "meeting/state.ts"
Cohesion: 0.18
Nodes (16): DEMO_SCRIPT, DEMO_SPEAKERS, PAUSE_WORDS, WORD_MS, initialMeeting(), Line, ME, MeetingAction (+8 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.13
Nodes (51): isProviderId(), replaceSelection(), getFieldAnchor(), isSelectionUnchanged(), wholeField(), sendMessage(), useTranslatorFlow(), apply() (+43 more)

### Community 6 - "MeetingPanel.stories.tsx"
Cohesion: 0.08
Nodes (24): AddedToVocabulary, at(), base, Checking, Empty, Ended, Explained, FIX (+16 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.06
Nodes (37): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+29 more)

### Community 8 - "contract.ts"
Cohesion: 0.09
Nodes (34): getSettings(), putSettings(), isForm(), isLang(), isUrl(), parseDetectBody(), parseDictationBody(), parseExceptions() (+26 more)

### Community 9 - "fix-grammar/fix-grammar.ts"
Cohesion: 0.18
Nodes (14): fixGrammar(), applyEdits(), editSegments(), mask(), tokensOf(), EXCEPTION_KINDS, ExceptionKind, FIX_KINDS (+6 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "translations.ts"
Cohesion: 0.38
Nodes (5): request, toRow(), TranslationRecord, translationsRepository, TranslateBody

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Session1.stories.tsx"
Cohesion: 0.07
Nodes (19): CALLBACKS, DICTATION, DictationGrammar, DictationTranslation, FAVORITES, GRAMMAR, HistoryVoiceSign, meta (+11 more)

### Community 15 - "history.ts"
Cohesion: 0.21
Nodes (19): 4. Client-side product logic (portable), Notice, useTranslation(), byDay(), byUse(), Common, dayLabel(), defaultPair() (+11 more)

### Community 16 - "TranslatorWidget.tsx"
Cohesion: 0.12
Nodes (22): Badge, CountBadge(), Anchor, ExceptionPanel(), LanguagesPanel(), BusyPanel(), ErrorPanel(), NotTextPanel() (+14 more)

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

### Community 26 - ".storybook/main.ts"
Cohesion: 0.40
Nodes (3): config, @tailwindcss/vite, wxt

### Community 27 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, flag-icons, @heroui/react, @heroui/styles, react, react-dom

### Community 28 - "Home.stories.tsx"
Cohesion: 0.14
Nodes (13): Busy, Default, DictatedGrammar, Empty, Error, Listening, meta, OnePair (+5 more)

### Community 30 - "buttons.tsx"
Cohesion: 0.11
Nodes (25): ICON_SIZE, ICON_TONE, IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT, PillButton() (+17 more)

### Community 31 - "meetings.ts"
Cohesion: 0.14
Nodes (16): Meetings(), MeetingsProps, MeetingScreen(), CHAT_NOTE, durationLabel(), item, MeetingLine, MeetingRecord (+8 more)

### Community 32 - "Session2.stories.tsx"
Cohesion: 0.10
Nodes (16): Empty, Ended, FixFailed, FixLoading, FixResult, Icons, LineSelected, Listening (+8 more)

### Community 33 - "useTranslatorFlow.ts"
Cohesion: 0.10
Nodes (37): applyEdits(), Chunk, cleanFix(), escapeHtml(), isFinished(), mergeFixes(), sentenceAt(), spliceFix() (+29 more)

### Community 34 - "HomeProps"
Cohesion: 0.13
Nodes (4): Home(), HomeProps, Pair, pairLabel()

### Community 35 - "AI Translator API README"
Cohesion: 0.13
Nodes (17): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), POST /translate, detections.verified feedback (+9 more)

### Community 36 - "SettingsPage.tsx"
Cohesion: 0.09
Nodes (16): browserLanguages(), nativeName(), searchLanguages(), AddLanguage(), MicState, AccountSection(), FieldsSection(), LanguagesSection() (+8 more)

### Community 39 - "react"
Cohesion: 0.13
Nodes (18): CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select(), Controls (+10 more)

### Community 40 - "Session3.stories.tsx"
Cohesion: 0.08
Nodes (18): CARD, CardEnded, CardFixResult, CardListening, CardMinimized, CardPaused, CardRenaming, HistoryTabs (+10 more)

### Community 41 - "History.tsx"
Cohesion: 0.15
Nodes (13): IconButton(), Icon(), Group(), Row(), SubHeader(), Text(), languageName(), ago() (+5 more)

### Community 42 - "toEdits.ts"
Cohesion: 0.05
Nodes (42): create, diff(), Segment, escapeHtml(), fromSegments(), ModelEdit, overlaps(), Span (+34 more)

### Community 44 - "Transcript.tsx"
Cohesion: 0.14
Nodes (11): IconName, ACTIONS, CheckRow(), ResultCard(), SpeakerLegend(), TranscriptCallbacks, TranscriptLine(), ResultKind (+3 more)

### Community 45 - "chunkRequests.test.ts"
Cohesion: 0.24
Nodes (7): Response, ChunkRequests, drop(), pump(), use(), isVerdict(), Verdict

### Community 46 - "SettingsApp.tsx"
Cohesion: 0.16
Nodes (15): 5. Browser / Web APIs used, ProviderId, PROVIDERS, useAccount(), useDisabledFields(), subscribe(), useHash(), useMicPermission() (+7 more)

### Community 47 - "Demo"
Cohesion: 0.29
Nodes (6): 1. Collect the session's changes, 2. Pick the next file, 3. Write `extension/src/demo/Session<N>.stories.tsx`, 4. Build, 5. Show, Demo

### Community 48 - "Extension Release"
Cohesion: 0.22
Nodes (8): 1. Find the baseline, 2. Understand the differences, 3. Propose the bump, 4. Update the description, 5. Write the changes, 6. Report, Extension Release, Where things live (WXT project)

### Community 49 - "controllers/fix-grammar.ts"
Cohesion: 0.36
Nodes (6): CorrectionRecord, correctionsRepository, request, toRow(), GUARD_MESSAGES, FixGrammarBody

### Community 50 - "Transcript.stories.tsx"
Cohesion: 0.11
Nodes (17): AddedToVocabulary, Failed, Highlighted, meta, MINE, OTHER, OtherSpeaker, pieces (+9 more)

### Community 51 - "API architecture rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

### Community 52 - "@storybook/react-vite"
Cohesion: 0.15
Nodes (13): PopupFrame(), From, Into, meta, Story, Empty, meta, NoStart (+5 more)

### Community 53 - "HistoryEntry"
Cohesion: 0.24
Nodes (5): Options, EntryActions, HistoryCard(), HistoryProps, HistoryEntry

### Community 54 - "app.ts"
Cohesion: 0.19
Nodes (31): checkController(), detectController(), explainController(), fixGrammarController(), rewriteController(), dictationController(), summarizeController(), transcribeController() (+23 more)

### Community 55 - "Rules"
Cohesion: 0.29
Nodes (3): Constraints that outrank tidiness, Extension UI (`extension/src/`), Rules

### Community 56 - "SettingsPage.stories.tsx"
Cohesion: 0.15
Nodes (11): SettingsPage(), Loading, meta, MicBlocked, MicRequested, NothingTurnedOff, Saved, SignedIn (+3 more)

### Community 57 - "content.ts"
Cohesion: 0.10
Nodes (25): 1. Collect two inputs, 2. Route each fact to one home, 3. Edit, 4. Verify and report, Common mistakes, Update project docs, darkQuery(), followColorScheme() (+17 more)

### Community 58 - "oauth.ts"
Cohesion: 0.24
Nodes (13): RFC-7636, base64url(), challengeFor(), createVerifier(), getAccessToken(), isExpired(), signIn(), store() (+5 more)

### Community 59 - "useMeetingDetail.ts"
Cohesion: 0.26
Nodes (9): transcriptActions(), transcriptSenders(), indexOf(), lineId(), useMeetingDetail(), transcriptText(), settingsItem, storageSettings (+1 more)

### Community 61 - "selection.ts"
Cohesion: 0.12
Nodes (32): 7.2 DOM layer (`content/`), caretIn(), insertIntoFocusedField(), InsertMessage, caretIn(), deepActiveElement(), EXCLUDED_INPUT_MODES, fieldKey() (+24 more)

### Community 62 - "app.test.ts"
Cohesion: 0.10
Nodes (28): jwt(), userToken(), client, LIVE_TRANSCRIBE_MODEL, MODEL, TRANSCRIBE_MODEL, typeSafeClient, DICTATION_PROMPT (+20 more)

### Community 63 - "useActiveSite.ts"
Cohesion: 0.22
Nodes (9): isSiteDisabled(), parseSites(), useSettings(), activeTab(), Tab, useActiveSite(), DisabledField, disabledFields (+1 more)

### Community 64 - "db.ts"
Cohesion: 0.11
Nodes (18): handler(), DetectionRecord, detectionsRepository, request, toRow(), RewriteRecord, rewritesRepository, request (+10 more)

### Community 65 - "transcript.ts"
Cohesion: 0.08
Nodes (35): 3.5 Meeting transcript, view(), Answer, Check, CheckView, emptyTranscript(), ERROR, Fix (+27 more)

### Community 66 - "ref_vitest"
Cohesion: 0.15
Nodes (10): isCyrillic(), layoutLanguages(), RUSSIAN_ONLY, switchLayout(), toCyrillic, toLatin, liveLanguage(), isVoiceLevel() (+2 more)

### Community 67 - "messages.ts"
Cohesion: 0.22
Nodes (18): 4.1 UI → worker (`messaging/messages.ts`), 4.2 Worker ↔ offscreen recorder (`messaging/recorder.ts`), 4.3 Popup → content script, 4. Messaging protocol, Account, ErrorCode, isMessage(), Message (+10 more)

### Community 68 - "Home.tsx"
Cohesion: 0.12
Nodes (19): fixedText(), GrammarPanel(), GrammarView, keptWords(), StatusChip(), BARS, Recording(), Colours (+11 more)

### Community 69 - "fixtures.ts"
Cohesion: 0.15
Nodes (12): HISTORY, LATELY, MEETINGS, MEETINGS_TAB, now, Default, Empty, MeetingsTab (+4 more)

### Community 73 - "AI Translator: system overview"
Cohesion: 0.33
Nodes (6): 1. What the product does, 2. System map, 3. Responsibility split (target state), 4. Repository layout, 5. Findings worth acting on before separating, AI Translator: system overview

### Community 74 - "CLAUDE.md"
Cohesion: 0.18
Nodes (10): GET/PUT /settings, Typed background-worker messaging protocol, Closed shadow-root translator widget, Extension is frontend only, Layered API architecture, Paste-first selection replacement, profiles table, Settings cache (server-authoritative) (+2 more)

### Community 75 - "meeting/view.ts"
Cohesion: 0.43
Nodes (7): clock(), lineView(), TranscriptLineView, MeetingState, MeetingView, STATUS_LABEL, toView()

### Community 76 - "visibleEdits"
Cohesion: 0.31
Nodes (9): rangeRects(), fixDictation(), Marked, measure(), useUnderlines(), editKey(), followEdit(), showsUnderlines() (+1 more)

### Community 78 - "ToolbarPopup.tsx"
Cohesion: 0.22
Nodes (12): 7.3 Toolbar popup (`popups/toolbar/`), useDictation(), useHistory(), useMeetings(), usePinned(), History(), MeetingDetail(), Screen (+4 more)

### Community 79 - "replace.ts"
Cohesion: 0.47
Nodes (8): bareLink(), dispatchInput(), isLink(), replaceInContentEditable(), replaceInTextControl(), tryInsertText(), tryPaste(), withAtoms()

### Community 80 - "wordStats.ts"
Cohesion: 0.14
Nodes (11): statsController(), env(), get(), Counter, ModelUse, WordStats, wordStatsRepository, ref_node_fs (+3 more)

### Community 81 - "7.1 In-page widget (`widgets/translator/`)"
Cohesion: 0.25
Nodes (7): 8. Data model (`supabase/migrations/`), 7.1 In-page widget (`widgets/translator/`), 7.4 Settings page (`popups/settings/`, served as `options.html`), 7.5 Meeting card (`widgets/meeting/`), 7.6 Voice pipeline (extension specifics), 7. UI surfaces, grammar()

### Community 91 - "Chrome extension"
Cohesion: 0.20
Nodes (9): 1. Runtime contexts, 2. Manifest, 3. Source layout, 6. Storage (`chrome.storage.local`), 8. Development, testing, release, 9. What is extension-only (would not carry to another client), Chrome extension, Dependency rules (+1 more)

## Knowledge Gaps
- **456 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+451 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 635 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `TranslatorWidget.stories.tsx`, `meeting/state.ts`, `extension/package.json`, `Session1.stories.tsx`, `history.ts`, `TranslatorWidget.tsx`, `icons.tsx`, `buttons.tsx`, `meetings.ts`, `Session2.stories.tsx`, `useTranslatorFlow.ts`, `SettingsPage.tsx`, `Session3.stories.tsx`, `History.tsx`, `Transcript.tsx`, `SettingsApp.tsx`, `@storybook/react-vite`, `content.ts`, `useMeetingDetail.ts`, `usePageEvents`, `useActiveSite.ts`, `ref_vitest`, `Home.tsx`, `visibleEdits`, `ToolbarPopup.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `API architecture rules` connect `API architecture rules` to `CLAUDE.md`, `graphify skill (SKILL.md)`, `Rules`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `API` connect `toEdits.ts` to `7.1 In-page widget (`widgets/translator/`)`, `app.ts`, `Rules`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `useTranslatorFlow()` (e.g. with `7.1 In-page widget (`widgets/translator/`)` and `closeSuggestion()`) actually correct?**
  _`useTranslatorFlow()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `sendMessage()` (e.g. with `Rules` and `Dependency rules`) actually correct?**
  _`sendMessage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `scopedLogger()` (e.g. with `3. Internal architecture` and `5. Findings worth acting on before separating`) actually correct?**
  _`scopedLogger()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _456 weakly-connected nodes found - possible documentation gaps or missing edges._