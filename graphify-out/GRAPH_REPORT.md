# Graph Report - ai-translator-ext  (2026-10-06)

## Corpus Check
- 265 files · ~133,461 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1700 nodes · 4438 edges · 95 communities (84 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 241 edges (avg confidence: 0.9)
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
- VocabException
- scripts
- extension/package.json
- controllers/translate.ts
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
- TranslatorWidget.tsx
- meetings.ts
- Session2.stories.tsx
- useTranslatorFlow.ts
- HomeProps
- AI Translator API README
- SettingsPage.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- Home.tsx
- Session3.stories.tsx
- Languages.tsx
- ref_vitest
- WidgetCallbacks
- MeetingDetail.tsx
- chunkRequests.test.ts
- SettingsApp.tsx
- react
- Extension Release
- corrections.ts
- Transcript.stories.tsx
- API architecture rules
- Meetings.stories.tsx
- History.tsx
- app.ts
- voiceStream.ts
- SettingsPage.stories.tsx
- Translator.tsx
- 4. Client-side product logic (portable)
- useMeetingDetail.ts
- usePageEvents
- selection.ts
- app.test.ts
- useActiveSite.ts
- controllers/rewrite.ts
- MeetingDetail.stories.tsx
- switchLayout
- api/package.json
- guard.ts
- @storybook/react-vite
- fixtures.ts
- ref_db_ts
- inventory.sh
- AI Translator: system overview
- CLAUDE.md
- MeetingPanel.tsx
- visibleEdits
- transcript.ts
- useDictation.ts
- replace.ts
- wordStats.ts
- API
- devDependencies
- controllers/detect.ts
- TranscriptDeps
- graphify reference: query, path, explain
- graphify reference: exports and benchmark
- settings.ts
- graphify reference: incremental update and cluster-only
- db.ts
- transcriptions.ts
- Chrome extension
- scripts
- rate-limit.ts
- .claude/CLAUDE.md (project instructions)

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 107 edges
2. `react` - 50 edges
3. `sendMessage()` - 36 edges
4. `scopedLogger()` - 31 edges
5. `fail()` - 29 edges
6. `4. Client-side product logic (portable)` - 28 edges
7. `requestId()` - 26 edges
8. `Icon()` - 26 edges
9. `wholeField()` - 24 edges
10. `benchmark()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `9. What is extension-only (would not carry to another client)` --references--> `fieldKey()`  [INFERRED]
  docs/extension.md → extension/src/content/selection.ts
- `1. Responsibilities` --references--> `switchLayout()`  [INFERRED]
  docs/api.md → extension/src/core/layout.ts
- `7.5 Meeting card (`widgets/meeting/`)` --references--> `mountMeeting()`  [INFERRED]
  docs/extension.md → extension/src/widgets/meeting/mount.ts
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `3.7 Settings` --references--> `Settings`  [INFERRED]
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

## Communities (95 total, 11 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.08
Nodes (57): RFC-7636, 4.1 UI → worker (`messaging/messages.ts`), 4.2 Worker ↔ offscreen recorder (`messaging/recorder.ts`), 4.3 Popup → content script, 4. Messaging protocol, ApiError, call(), check() (+49 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.04
Nodes (46): Busy, DictationTranslated, Error, estimate, Exception, FAVORITES, FieldIcon, FieldIconChecking (+38 more)

### Community 2 - "translator/view.ts"
Cohesion: 0.13
Nodes (34): Anchor, EditableSelection, browserLanguages(), findLanguage(), extension_src_core_languages_language, languageName(), Action, answered() (+26 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.19
Nodes (16): graphify reference: extraction subagent prompt, Discrete confidence_score rubric, Node ID format (full repo-relative stem), Extraction subagent prompt, graphify reference: transcribe video and audio, Whisper transcription with domain-hint prompt, graphify skill (SKILL.md), Structural AST extraction (Part A) (+8 more)

### Community 4 - "meeting/state.ts"
Cohesion: 0.15
Nodes (20): TranscriptState, MeetingLine, meetingsStore, DEMO_SCRIPT, DEMO_SPEAKERS, PAUSE_WORDS, WORD_MS, useMeeting() (+12 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.14
Nodes (46): 7.2 DOM layer (`content/`), isProviderId(), replaceSelection(), fieldKey(), fieldLabel(), getFieldAnchor(), isSelectionUnchanged(), partOf() (+38 more)

### Community 6 - "MeetingPanel.stories.tsx"
Cohesion: 0.08
Nodes (24): AddedToVocabulary, at(), base, Checking, Empty, Ended, Explained, FIX (+16 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.21
Nodes (12): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+4 more)

### Community 8 - "contract.ts"
Cohesion: 0.11
Nodes (32): isForm(), isLang(), isUrl(), parseDetectBody(), parseDictationBody(), parseExceptions(), parseExplainBody(), parseFixGrammarBody() (+24 more)

### Community 9 - "VocabException"
Cohesion: 0.22
Nodes (9): Exceptions(), Learning(), VocabularyProps, dayLabel(), exceptions, vocabulary, VocabWord, words (+1 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "controllers/translate.ts"
Cohesion: 0.36
Nodes (6): request, toRow(), TranslationRecord, translationsRepository, wordStatsRepository, TranslateBody

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Session1.stories.tsx"
Cohesion: 0.07
Nodes (16): CALLBACKS, DICTATION, DictationGrammar, DictationTranslation, FAVORITES, GRAMMAR, HistoryVoiceSign, meta (+8 more)

### Community 15 - "ToolbarPopup.tsx"
Cohesion: 0.18
Nodes (22): useHistory(), useMeetings(), usePinned(), Notice, useTranslation(), Screen, ToolbarPopup(), byUse() (+14 more)

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
Cohesion: 0.19
Nodes (16): toPcm16Base64(), append(), dataUrl(), finish(), handle(), Live, opened(), queue (+8 more)

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

### Community 30 - "TranslatorWidget.tsx"
Cohesion: 0.07
Nodes (42): ICON_SIZE, ICON_TONE, IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT, PillButton() (+34 more)

### Community 31 - "meetings.ts"
Cohesion: 0.15
Nodes (15): Meetings(), MeetingsProps, MeetingScreen(), CHAT_NOTE, durationLabel(), item, MeetingRecord, MEETINGS_LIMIT (+7 more)

### Community 32 - "Session2.stories.tsx"
Cohesion: 0.10
Nodes (16): Empty, Ended, FixFailed, FixLoading, FixResult, Icons, LineSelected, Listening (+8 more)

### Community 33 - "useTranslatorFlow.ts"
Cohesion: 0.15
Nodes (18): applyEdits(), Chunk, sentenceAt(), spliceFix(), withoutFixEdit(), Ask, sentenceFixes(), sentences() (+10 more)

### Community 34 - "HomeProps"
Cohesion: 0.14
Nodes (3): Home(), HomeProps, Pair

### Community 35 - "AI Translator API README"
Cohesion: 0.10
Nodes (21): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+13 more)

### Community 36 - "SettingsPage.tsx"
Cohesion: 0.18
Nodes (10): nativeName(), searchLanguages(), AddLanguage(), LanguagesSection(), Section(), SectionId, SECTIONS, titleOf() (+2 more)

### Community 39 - "Home.tsx"
Cohesion: 0.17
Nodes (16): Icon(), CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select() (+8 more)

### Community 40 - "Session3.stories.tsx"
Cohesion: 0.08
Nodes (18): CARD, CardEnded, CardFixResult, CardListening, CardMinimized, CardPaused, CardRenaming, HistoryTabs (+10 more)

### Community 41 - "Languages.tsx"
Cohesion: 0.11
Nodes (19): Group(), Row(), SubHeader(), Colours, meta, Scale, TONES, Text() (+11 more)

### Community 42 - "ref_vitest"
Cohesion: 0.06
Nodes (42): fixGrammar(), create, applyEdits(), diff(), Segment, editSegments(), escapeHtml(), fromSegments() (+34 more)

### Community 44 - "MeetingDetail.tsx"
Cohesion: 0.13
Nodes (11): IconButton(), ACTIONS, CheckRow(), ResultCard(), SpeakerLegend(), TranscriptCallbacks, TranscriptLine(), ResultKind (+3 more)

### Community 45 - "chunkRequests.test.ts"
Cohesion: 0.22
Nodes (8): Response, ChunkRequests, drop(), pump(), use(), isVerdict(), Verdict, toCheck()

### Community 46 - "SettingsApp.tsx"
Cohesion: 0.08
Nodes (22): ProviderId, PROVIDERS, isSiteDisabled(), parseSites(), useAccount(), useDisabledFields(), subscribe(), useHash() (+14 more)

### Community 47 - "react"
Cohesion: 0.14
Nodes (11): 1. Collect the session's changes, 2. Pick the next file, 3. Write `extension/src/demo/Session<N>.stories.tsx`, 4. Build, 5. Show, Demo, PopupFrame(), item (+3 more)

### Community 48 - "Extension Release"
Cohesion: 0.22
Nodes (8): 1. Find the baseline, 2. Understand the differences, 3. Propose the bump, 4. Update the description, 5. Write the changes, 6. Report, Extension Release, Where things live (WXT project)

### Community 49 - "corrections.ts"
Cohesion: 0.38
Nodes (5): CorrectionRecord, correctionsRepository, request, toRow(), FixGrammarBody

### Community 50 - "Transcript.stories.tsx"
Cohesion: 0.11
Nodes (17): AddedToVocabulary, Failed, Highlighted, meta, MINE, OTHER, OtherSpeaker, pieces (+9 more)

### Community 51 - "API architecture rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

### Community 52 - "Meetings.stories.tsx"
Cohesion: 0.22
Nodes (8): MEETINGS_TAB, Empty, meta, NoStart, NoteCopied, Story, Undo, WithMeetings

### Community 53 - "History.tsx"
Cohesion: 0.17
Nodes (11): Options, EntryActions, HistoryCard(), HistoryRow(), time(), where(), History(), HistoryProps (+3 more)

### Community 54 - "app.ts"
Cohesion: 0.22
Nodes (26): checkController(), detectController(), explainController(), fixGrammarController(), rewriteController(), dictationController(), statsController(), summarizeController() (+18 more)

### Community 55 - "voiceStream.ts"
Cohesion: 0.10
Nodes (25): BAD_TICKET, opened(), parse(), SocketLike, FakeSocket, voiceStream(), appendAudio(), commitAudio() (+17 more)

### Community 56 - "SettingsPage.stories.tsx"
Cohesion: 0.15
Nodes (11): SettingsPage(), Loading, meta, MicBlocked, MicRequested, NothingTurnedOff, Saved, SignedIn (+3 more)

### Community 57 - "Translator.tsx"
Cohesion: 0.10
Nodes (27): 1. Collect two inputs, 2. Route each fact to one home, 3. Edit, 4. Verify and report, Common mistakes, Update project docs, darkQuery(), followColorScheme() (+19 more)

### Community 58 - "4. Client-side product logic (portable)"
Cohesion: 0.13
Nodes (32): 4. Client-side product logic (portable), cleanFix(), escapeHtml(), isFinished(), mergeFixes(), carryOver(), extension_src_widgets_translator_chunks_chunk, extension_src_widgets_translator_chunks_cleanfix (+24 more)

### Community 59 - "useMeetingDetail.ts"
Cohesion: 0.29
Nodes (8): Check, transcriptActions(), transcriptSenders(), indexOf(), lineId(), useMeetingDetail(), settingsItem, storageSettings

### Community 61 - "selection.ts"
Cohesion: 0.16
Nodes (24): caretIn(), insertIntoFocusedField(), InsertMessage, caretIn(), deepActiveElement(), EXCLUDED_INPUT_MODES, findContentEditableHost(), getEditableSelection() (+16 more)

### Community 62 - "app.test.ts"
Cohesion: 0.17
Nodes (13): app, jwt(), userToken(), client, LIVE_TRANSCRIBE_MODEL, MODEL, TRANSCRIBE_MODEL, DICTATION_PROMPT (+5 more)

### Community 63 - "useActiveSite.ts"
Cohesion: 0.40
Nodes (5): 7.3 Toolbar popup (`popups/toolbar/`), activeTab(), Tab, useActiveSite(), MeetingDetail()

### Community 64 - "controllers/rewrite.ts"
Cohesion: 0.31
Nodes (7): RewriteRecord, rewritesRepository, request, toRow(), rewrite(), STYLE, RewriteBody

### Community 65 - "MeetingDetail.stories.tsx"
Cohesion: 0.11
Nodes (21): 3.5 Meeting transcript, view(), emptyTranscript(), highlightText(), run(), TranscriptAction, transcriptReducer(), words() (+13 more)

### Community 66 - "switchLayout"
Cohesion: 0.33
Nodes (6): isCyrillic(), layoutLanguages(), RUSSIAN_ONLY, switchLayout(), toCyrillic, toLatin

### Community 67 - "api/package.json"
Cohesion: 0.12
Nodes (15): typescript, vitest, name, private, type, version, port, server (+7 more)

### Community 68 - "guard.ts"
Cohesion: 0.27
Nodes (12): guardText, typeSafeClient, COUNTS, grammarQuality(), GUARD_MESSAGES, GuardVerdict, toVerdict(), validateGuard() (+4 more)

### Community 69 - "@storybook/react-vite"
Cohesion: 0.18
Nodes (9): Default, Empty, MeetingsTab, MeetingsTabEmpty, meta, Story, Undo, config (+1 more)

### Community 70 - "fixtures.ts"
Cohesion: 0.16
Nodes (11): WidgetDictationTranslation(), WidgetRecording(), HISTORY, LATELY, MEETINGS, noop(), now, From (+3 more)

### Community 73 - "AI Translator: system overview"
Cohesion: 0.22
Nodes (6): 1. What the product does, 2. System map, 3. Responsibility split (target state), 4. Repository layout, 5. Findings worth acting on before separating, AI Translator: system overview

### Community 74 - "CLAUDE.md"
Cohesion: 0.14
Nodes (12): Typed background-worker messaging protocol, Closed shadow-root translator widget, Extension is frontend only, Layered API architecture, Paste-first selection replacement, Constraints that outrank tidiness, Extension UI (`extension/src/`), Rules (+4 more)

### Community 75 - "MeetingPanel.tsx"
Cohesion: 0.24
Nodes (8): clock(), lineView(), TranscriptLineView, DOT, MeetingPanel(), MeetingView, STATUS_LABEL, toView()

### Community 76 - "visibleEdits"
Cohesion: 0.32
Nodes (10): inside(), rangeAt(), rangeRects(), textControlRects(), Marked, measure(), useUnderlines(), showsUnderlines() (+2 more)

### Community 77 - "transcript.ts"
Cohesion: 0.17
Nodes (12): Answer, CheckView, ERROR, Fix, FixPart, fixParts(), Highlight, Piece (+4 more)

### Community 78 - "useDictation.ts"
Cohesion: 0.48
Nodes (3): liveLanguage(), isVoiceLevel(), useDictation()

### Community 79 - "replace.ts"
Cohesion: 0.47
Nodes (8): bareLink(), dispatchInput(), isLink(), replaceInContentEditable(), replaceInTextControl(), tryInsertText(), tryPaste(), withAtoms()

### Community 80 - "wordStats.ts"
Cohesion: 0.18
Nodes (8): env(), get(), Counter, ModelUse, WordStats, ref_node_fs, ref_node_os, ref_node_path

### Community 81 - "API"
Cohesion: 0.14
Nodes (15): 10. Testing, 1. Responsibilities, 2. Runtime and deployment, 4. External services, 5. Endpoints, 6. Authentication and authorisation, 7. Cross-cutting, 8. Data model (`supabase/migrations/`) (+7 more)

### Community 82 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, hono, @hono/node-server, openai, postgres, @types/node, @types/ws, @typesafe-ai/sdk (+3 more)

### Community 83 - "controllers/detect.ts"
Cohesion: 0.36
Nodes (6): DetectionRecord, detectionsRepository, request, toRow(), detectLang(), DetectBody

### Community 85 - "graphify reference: query, path, explain"
Cohesion: 0.22
Nodes (9): graphify reference: GitHub clone and cross-repo merge, graphify clone GitHub repo, graphify merge-graphs cross-repo merge, graphify reference: query, path, explain, BFS vs DFS traversal modes, graphify explain node, graphify path shortest path, Constrained query expansion against graph vocabulary (+1 more)

### Community 86 - "graphify reference: exports and benchmark"
Cohesion: 0.25
Nodes (8): graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export, GraphML export, MCP stdio server, Neo4j export, SVG export, Wiki export

### Community 87 - "settings.ts"
Cohesion: 0.32
Nodes (5): getSettings(), putSettings(), profilesRepository, rows, DEFAULT_SETTINGS

### Community 88 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.33
Nodes (7): graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, Post-commit hook (AST-only rebuild), graphify reference: incremental update and cluster-only, --cluster-only reclustering, Incremental --update re-extraction

### Community 89 - "db.ts"
Cohesion: 0.57
Nodes (3): handler(), checkDb(), sql

### Community 90 - "transcriptions.ts"
Cohesion: 0.38
Nodes (5): audio, toRow(), TranscriptionRecord, transcriptionsRepository, TranscribeBody

### Community 91 - "Chrome extension"
Cohesion: 0.15
Nodes (12): 1. Runtime contexts, 2. Manifest, 6. Storage (`chrome.storage.local`), 7.1 In-page widget (`widgets/translator/`), 7.4 Settings page (`popups/settings/`, served as `options.html`), 7.5 Meeting card (`widgets/meeting/`), 7.6 Voice pipeline (extension specifics), 7. UI surfaces (+4 more)

### Community 92 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, compile, dev, test, token

### Community 93 - "rate-limit.ts"
Cohesion: 0.50
Nodes (4): hits, isRateLimited(), rateLimit, ref_hono_factory

### Community 94 - ".claude/CLAUDE.md (project instructions)"
Cohesion: 0.50
Nodes (4): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: commit hook and CLAUDE.md integration, graphify claude install (CLAUDE.md integration)

## Knowledge Gaps
- **465 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+460 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 649 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `TranslatorWidget.stories.tsx`, `meeting/state.ts`, `VocabException`, `extension/package.json`, `Session1.stories.tsx`, `ToolbarPopup.tsx`, `Trigger.tsx`, `icons.tsx`, `TranslatorWidget.tsx`, `meetings.ts`, `Session2.stories.tsx`, `useTranslatorFlow.ts`, `SettingsPage.tsx`, `Home.tsx`, `Session3.stories.tsx`, `Languages.tsx`, `MeetingDetail.tsx`, `SettingsApp.tsx`, `History.tsx`, `Translator.tsx`, `useMeetingDetail.ts`, `usePageEvents`, `useActiveSite.ts`, `visibleEdits`, `useDictation.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `API` connect `API` to `AI Translator: system overview`, `ref_vitest`, `app.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `API architecture rules` connect `API architecture rules` to `AI Translator: system overview`, `CLAUDE.md`, `.claude/CLAUDE.md (project instructions)`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `useTranslatorFlow()` (e.g. with `7.1 In-page widget (`widgets/translator/`)` and `closeSuggestion()`) actually correct?**
  _`useTranslatorFlow()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `sendMessage()` (e.g. with `Rules` and `Dependency rules`) actually correct?**
  _`sendMessage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `scopedLogger()` (e.g. with `3. Internal architecture` and `5. Findings worth acting on before separating`) actually correct?**
  _`scopedLogger()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _465 weakly-connected nodes found - possible documentation gaps or missing edges._