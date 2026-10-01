# Graph Report - ai-translator-ext  (2026-10-01)

## Corpus Check
- 207 files · ~94,960 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1219 nodes · 3130 edges · 62 communities (55 shown, 7 thin omitted)
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
- app.test.ts
- scripts
- extension/package.json
- OptionsApp.tsx
- compilerOptions
- Session1.stories.tsx
- API architecture rules
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
- controllers/translate.ts
- selection.ts
- corrections.ts
- view.ts
- useTranslatorFlow.ts
- usePageEvents
- History.stories.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- Home.tsx
- controllers/transcribe.ts
- react
- ref_vitest
- LanguagesPanel.tsx
- inputs.tsx
- chunks.test.ts
- WidgetCallbacks
- Demo
- Extension Release
- db.ts
- wordStats.ts
- rewrites.ts
- languages.ts
- api/package.json
- app.ts
- OptionsPage.stories.tsx
- dev-jwt.ts
- useUnderlines.ts
- devDependencies
- replace.ts
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
- `Rules` --references--> `sendMessage()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/messaging/messages.ts
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `Rules` --references--> `TranslatorWidget()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/TranslatorWidget.tsx
- `CorrectionRecord` --references--> `FixGrammarBody`  [EXTRACTED]
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

## Communities (62 total, 7 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.10
Nodes (41): RFC-7636, ApiError, call(), check(), detect(), fixGrammar(), getSettings(), reportDictation() (+33 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.04
Nodes (43): Busy, DictationTranslated, Error, estimate, FieldIcon, FieldIconChecking, FieldIconClean, FieldIconError (+35 more)

### Community 2 - "ToolbarPopup.tsx"
Cohesion: 0.06
Nodes (36): editKey(), useGrammarFix(), useHistory(), usePinned(), Notice, Options, useTranslation(), EntryActions (+28 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "fail"
Cohesion: 0.26
Nodes (19): checkController(), detectController(), fixGrammarController(), rewriteController(), dictationController(), translateController(), voiceSessionController(), guardText (+11 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.14
Nodes (44): isProviderId(), replaceSelection(), getFieldAnchor(), wholeField(), sendMessage(), useTranslatorFlow(), apply(), checkField() (+36 more)

### Community 6 - "Translator.tsx"
Cohesion: 0.11
Nodes (20): darkQuery(), followColorScheme(), subscribeDark(), usePrefersDark(), extension_src_components_theme, insertIntoFocusedField(), isInsertMessage(), main() (+12 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.22
Nodes (7): devToken(), gateway, token(), signJwt(), translationsRepository, port, @hono/node-server

### Community 8 - "contract.ts"
Cohesion: 0.13
Nodes (24): getSettings(), putSettings(), profilesRepository, rows, DEFAULT_SETTINGS, DetectBody, DictationBody, FIX_KINDS (+16 more)

### Community 9 - "app.test.ts"
Cohesion: 0.16
Nodes (17): jwt(), userToken(), wordStatsRepository, client, LIVE_TRANSCRIBE_MODEL, MODEL, TRANSCRIBE_MODEL, typeSafeClient (+9 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "OptionsApp.tsx"
Cohesion: 0.12
Nodes (15): isSiteDisabled(), parseSites(), Account, OptionsApp(), OptionsPage(), OptionsPageProps, MicState, useMicPermission() (+7 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "Session1.stories.tsx"
Cohesion: 0.07
Nodes (15): CALLBACKS, DICTATION, DictationGrammar, DictationTranslation, GRAMMAR, HistoryVoiceSign, meta, OptionsMicrophone (+7 more)

### Community 15 - "API architecture rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

### Community 16 - "TranslatorWidget.tsx"
Cohesion: 0.17
Nodes (19): Anchor, BusyPanel(), ErrorPanel(), NotTextPanel(), SignInPanel(), Mark, Underlines(), clamp() (+11 more)

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

### Community 30 - "controllers/translate.ts"
Cohesion: 0.19
Nodes (12): DetectionRecord, detectionsRepository, request, toRow(), request, toRow(), TranslationRecord, createInput() (+4 more)

### Community 31 - "selection.ts"
Cohesion: 0.15
Nodes (28): caretIn(), InsertMessage, caretIn(), deepActiveElement(), EXCLUDED_INPUT_MODES, fieldKey(), fieldLabel(), findContentEditableHost() (+20 more)

### Community 32 - "corrections.ts"
Cohesion: 0.40
Nodes (4): CorrectionRecord, correctionsRepository, request, toRow()

### Community 33 - "view.ts"
Cohesion: 0.10
Nodes (37): EditableSelection, plainText(), extension_src_core_languages_language, isCyrillic(), layoutLanguages(), RUSSIAN_ONLY, switchLayout(), toCyrillic (+29 more)

### Community 34 - "useTranslatorFlow.ts"
Cohesion: 0.13
Nodes (20): applyEdits(), withoutFixEdit(), Ask, sentenceFixes(), sentences(), ErrorCode, Response, ResponseMap (+12 more)

### Community 35 - "usePageEvents"
Cohesion: 0.05
Nodes (33): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+25 more)

### Community 36 - "History.stories.tsx"
Cohesion: 0.13
Nodes (16): WidgetDictationTranslation(), WidgetRecording(), HISTORY, LATELY, noop(), now, PopupFrame(), Default (+8 more)

### Community 39 - "Home.tsx"
Cohesion: 0.13
Nodes (21): ICON_SIZE, ICON_TONE, IconButton(), IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT (+13 more)

### Community 40 - "controllers/transcribe.ts"
Cohesion: 0.29
Nodes (8): transcribeController(), audio, toRow(), TranscriptionRecord, transcriptionsRepository, detectLang(), transcribe(), TranscribeOk

### Community 41 - "react"
Cohesion: 0.16
Nodes (17): Icon(), SearchField(), Group(), Row(), SubHeader(), Colours, meta, Scale (+9 more)

### Community 42 - "ref_vitest"
Cohesion: 0.15
Nodes (15): fixGrammar(), applyEdits(), diff(), Segment, editSegments(), escapeHtml(), fromSegments(), ModelEdit (+7 more)

### Community 43 - "LanguagesPanel.tsx"
Cohesion: 0.15
Nodes (15): Badge, CountBadge(), Flag(), IconName, Divider(), Item(), Section(), Status() (+7 more)

### Community 44 - "inputs.tsx"
Cohesion: 0.14
Nodes (16): CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), Segmented(), Select(), StatusChip(), Controls (+8 more)

### Community 45 - "chunks.test.ts"
Cohesion: 0.17
Nodes (21): Chunk, cleanFix(), escapeHtml(), isFinished(), mergeFixes(), carryOver(), extension_src_widgets_translator_chunks_chunk, extension_src_widgets_translator_chunks_cleanfix (+13 more)

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
Cohesion: 0.22
Nodes (5): Counter, WordStats, ref_node_fs, ref_node_os, ref_node_path

### Community 51 - "rewrites.ts"
Cohesion: 0.38
Nodes (5): RewriteRecord, rewritesRepository, request, toRow(), RewriteOk

### Community 52 - "languages.ts"
Cohesion: 0.31
Nodes (8): browserLanguages(), findLanguage(), nativeName(), searchLanguages(), FAVORITES, FAVORITES, LANGUAGES, LANGUAGES_MAP

### Community 53 - "api/package.json"
Cohesion: 0.20
Nodes (9): typescript, vitest, name, private, type, version, openai, postgres (+1 more)

### Community 54 - "app.ts"
Cohesion: 0.13
Nodes (17): app, statsController(), requireUser(), userIdFrom(), parseDetectBody(), parseDictationBody(), parseFixGrammarBody(), parseRewriteBody() (+9 more)

### Community 55 - "OptionsPage.stories.tsx"
Cohesion: 0.12
Nodes (13): ProviderId, PROVIDERS, Failed, Loading, meta, MicRequested, Saved, Saving (+5 more)

### Community 56 - "dev-jwt.ts"
Cohesion: 0.39
Nodes (8): ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey(), jwks(), verifyAsymmetric(), verifyJwt()

### Community 57 - "useUnderlines.ts"
Cohesion: 0.25
Nodes (12): inside(), rangeRects(), textControlRects(), openSuggestion(), Marked, measure(), useUnderlines(), showsUnderlines() (+4 more)

### Community 58 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, hono, @hono/node-server, openai, postgres, @types/node, @typesafe-ai/sdk, typescript (+1 more)

### Community 59 - "replace.ts"
Cohesion: 0.47
Nodes (8): bareLink(), dispatchInput(), isLink(), replaceInContentEditable(), replaceInTextControl(), tryInsertText(), tryPaste(), withAtoms()

### Community 62 - "Languages"
Cohesion: 0.40
Nodes (3): ago(), Languages(), LanguagesProps

### Community 63 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, compile, dev, test, token

## Knowledge Gaps
- **307 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+302 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 444 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Rules` connect `usePageEvents` to `useTranslatorFlow`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `TranslatorWidget.stories.tsx`, `useTranslatorFlow.ts`, `ToolbarPopup.tsx`, `History.stories.tsx`, `usePageEvents`, `Translator.tsx`, `Home.tsx`, `extension/package.json`, `inputs.tsx`, `LanguagesPanel.tsx`, `Session1.stories.tsx`, `OptionsApp.tsx`, `TranslatorWidget.tsx`, `icons.tsx`, `offscreen/main.ts`, `useUnderlines.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `useTranslatorFlow()` (e.g. with `closeSuggestion()` and `disableField()`) actually correct?**
  _`useTranslatorFlow()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _307 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0963265306122449 - nodes in this community are weakly interconnected._
- **Should `TranslatorWidget.stories.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `ToolbarPopup.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06086956521739131 - nodes in this community are weakly interconnected._