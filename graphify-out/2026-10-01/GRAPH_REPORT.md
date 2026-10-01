# Graph Report - ai-translator-ext  (2026-10-01)

## Corpus Check
- 198 files · ~89,204 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1147 nodes · 2955 edges · 55 communities (48 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 86 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f4936287`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- background.ts
- TranslatorWidget.stories.tsx
- ToolbarPopup.tsx
- graphify skill (SKILL.md)
- fail
- useTranslatorFlow
- selection.ts
- dev-gateway.ts
- contract.ts
- app.test.ts
- scripts
- extension/package.json
- OptionsApp.tsx
- compilerOptions
- controllers/detect.ts
- API architecture rules
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
- mount.ts
- fix-grammar/fix-grammar.ts
- LanguagesPanel.tsx
- useTranslatorFlow.ts
- TranslatorWidget.tsx
- AI Translator API README
- Languages.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- Home.tsx
- messages.ts
- typography.tsx
- ref_vitest
- chunks.ts
- inputs.tsx
- translations.ts
- chunkRequests.test.ts
- app.ts
- Extension Release
- useUnderlines.ts
- layout.ts
- controllers/rewrite.ts
- CLAUDE.md
- usePageEvents
- replace.ts

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 95 edges
2. `react` - 32 edges
3. `sendMessage()` - 29 edges
4. `fail()` - 24 edges
5. `wholeField()` - 23 edges
6. `scopedLogger()` - 21 edges
7. `HomeProps` - 21 edges
8. `HistoryEntry` - 20 edges
9. `graphify skill (SKILL.md)` - 19 edges
10. `Icon()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `Rules` --references--> `sendMessage()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/messaging/messages.ts
- `Rules` --references--> `TranslatorWidget()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/TranslatorWidget.tsx
- `ModelEdit` --references--> `FixKind`  [EXTRACTED]
  api/src/resources/aiClient/requests/fix-grammar/utils/toEdits.ts → shared/contract.ts
- `GrammarView` --references--> `FixKind`  [EXTRACTED]
  extension/src/components/GrammarPanel.tsx → shared/contract.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (55 total, 7 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.13
Nodes (32): RFC-7636, ApiError, call(), check(), detect(), fixGrammar(), getSettings(), rewrite() (+24 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.04
Nodes (44): Busy, DictationTranslated, Error, estimate, FAVORITES, FieldIcon, FieldIconChecking, FieldIconClean (+36 more)

### Community 2 - "ToolbarPopup.tsx"
Cohesion: 0.05
Nodes (47): activeTab(), Tab, useActiveSite(), editKey(), useGrammarFix(), useHistory(), usePinned(), Notice (+39 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "fail"
Cohesion: 0.27
Nodes (19): checkController(), detectController(), fixGrammarController(), rewriteController(), transcribeController(), translateController(), voiceSessionController(), guardText (+11 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.15
Nodes (42): isProviderId(), getFieldAnchor(), wholeField(), sendMessage(), useTranslatorFlow(), apply(), checkField(), checkGrammar() (+34 more)

### Community 6 - "selection.ts"
Cohesion: 0.15
Nodes (28): caretIn(), InsertMessage, caretIn(), deepActiveElement(), EXCLUDED_INPUT_MODES, fieldKey(), fieldLabel(), findContentEditableHost() (+20 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.06
Nodes (43): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+35 more)

### Community 8 - "contract.ts"
Cohesion: 0.15
Nodes (18): getSettings(), putSettings(), profilesRepository, rows, CheckBody, DEFAULT_SETTINGS, HOSTNAME, LANGUAGE_CODE (+10 more)

### Community 9 - "app.test.ts"
Cohesion: 0.18
Nodes (15): jwt(), userToken(), client, LIVE_TRANSCRIBE_MODEL, TRANSCRIBE_MODEL, typeSafeClient, COUNTS, grammarQuality() (+7 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "OptionsApp.tsx"
Cohesion: 0.08
Nodes (24): ProviderId, PROVIDERS, extension_src_core_languages_language, isSiteDisabled(), parseSites(), Account, OptionsApp(), OptionsPage() (+16 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "controllers/detect.ts"
Cohesion: 0.54
Nodes (5): DetectionRecord, detectionsRepository, detectLang(), DetectBody, DetectOk

### Community 15 - "API architecture rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

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
Cohesion: 0.13
Nodes (25): applyEvent(), emptyTranscript(), isComplete(), liveText(), LiveTranscript, ServerEvent, run(), toPcm16Base64() (+17 more)

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
Cohesion: 0.08
Nodes (29): HISTORY, LATELY, noop(), now, PopupFrame(), Default, Empty, meta (+21 more)

### Community 30 - "mount.ts"
Cohesion: 0.12
Nodes (18): darkQuery(), followColorScheme(), subscribeDark(), usePrefersDark(), extension_src_components_theme, insertIntoFocusedField(), isInsertMessage(), main() (+10 more)

### Community 31 - "fix-grammar/fix-grammar.ts"
Cohesion: 0.39
Nodes (4): MODEL, fixGrammar(), applyEdits(), FIX_KINDS

### Community 32 - "LanguagesPanel.tsx"
Cohesion: 0.18
Nodes (13): Flag(), IconName, Divider(), Item(), Section(), Status(), DictationBar(), Transcript() (+5 more)

### Community 33 - "useTranslatorFlow.ts"
Cohesion: 0.10
Nodes (42): EditableSelection, plainText(), applyEdits(), withoutFixEdit(), RequestSlot, DistributiveOmit, FlowOptions, replaceEdit() (+34 more)

### Community 34 - "TranslatorWidget.tsx"
Cohesion: 0.13
Nodes (13): Anchor, LanguagesPanel(), LayoutPanel(), BusyPanel(), ErrorPanel(), NotTextPanel(), SignInPanel(), Mark (+5 more)

### Community 35 - "AI Translator API README"
Cohesion: 0.10
Nodes (21): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+13 more)

### Community 36 - "Languages.tsx"
Cohesion: 0.17
Nodes (16): Group(), Row(), SubHeader(), browserLanguages(), findLanguage(), languageName(), nativeName(), searchLanguages() (+8 more)

### Community 39 - "Home.tsx"
Cohesion: 0.15
Nodes (20): ICON_SIZE, ICON_TONE, IconButton(), IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT (+12 more)

### Community 40 - "messages.ts"
Cohesion: 0.18
Nodes (15): CorrectionRecord, correctionsRepository, TranscriptionRecord, transcriptionsRepository, sql, ErrorCode, isMessage(), Message (+7 more)

### Community 41 - "typography.tsx"
Cohesion: 0.23
Nodes (9): Colours, meta, Scale, TONES, TEXT_TONE, TextTone, TextVariant, VARIANT (+1 more)

### Community 42 - "ref_vitest"
Cohesion: 0.11
Nodes (18): request, toRow(), request, toRow(), audio, toRow(), diff(), Segment (+10 more)

### Community 43 - "chunks.ts"
Cohesion: 0.29
Nodes (14): carryOver(), Chunk, cleanFix(), escapeHtml(), fixOf(), isBeingTyped(), isFinished(), mergeFixes() (+6 more)

### Community 44 - "inputs.tsx"
Cohesion: 0.18
Nodes (14): CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented(), Select(), StatusChip() (+6 more)

### Community 45 - "translations.ts"
Cohesion: 0.31
Nodes (7): request, toRow(), TranslationRecord, createInput(), translate(), TranslateBody, TranslateOk

### Community 46 - "chunkRequests.test.ts"
Cohesion: 0.24
Nodes (6): Response, ChunkRequests, drop(), pump(), use(), Verdict

### Community 47 - "app.ts"
Cohesion: 0.14
Nodes (15): app, requireUser(), userIdFrom(), parseDetectBody(), parseFixGrammarBody(), parseRewriteBody(), parseSettings(), parseTranscribeBody() (+7 more)

### Community 48 - "Extension Release"
Cohesion: 0.22
Nodes (8): 1. Find the baseline, 2. Understand the differences, 3. Propose the bump, 4. Update the description, 5. Write the changes, 6. Report, Extension Release, Where things live (WXT project)

### Community 49 - "useUnderlines.ts"
Cohesion: 0.33
Nodes (9): inside(), rangeRects(), textControlRects(), openSuggestion(), Marked, measure(), useUnderlines(), showsUnderlines() (+1 more)

### Community 50 - "layout.ts"
Cohesion: 0.33
Nodes (6): isCyrillic(), layoutLanguages(), RUSSIAN_ONLY, switchLayout(), toCyrillic, toLatin

### Community 51 - "controllers/rewrite.ts"
Cohesion: 0.30
Nodes (8): RewriteRecord, rewritesRepository, request, toRow(), rewrite(), STYLE, RewriteBody, RewriteOk

### Community 52 - "CLAUDE.md"
Cohesion: 0.17
Nodes (10): Typed background-worker messaging protocol, Closed shadow-root translator widget, Extension is frontend only, Layered API architecture, Paste-first selection replacement, Constraints that outrank tidiness, Extension UI (`extension/src/`), Rules (+2 more)

### Community 54 - "replace.ts"
Cohesion: 0.40
Nodes (9): bareLink(), dispatchInput(), isLink(), replaceInContentEditable(), replaceInTextControl(), replaceSelection(), tryInsertText(), tryPaste() (+1 more)

## Knowledge Gaps
- **288 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 403 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `ToolbarPopup.tsx` to `LanguagesPanel.tsx`, `useTranslatorFlow.ts`, `TranslatorWidget.tsx`, `TranslatorWidget.stories.tsx`, `Languages.tsx`, `Home.tsx`, `typography.tsx`, `extension/package.json`, `inputs.tsx`, `OptionsApp.tsx`, `Trigger.tsx`, `useUnderlines.ts`, `icons.tsx`, `offscreen/main.ts`, `usePageEvents`, `Home.stories.tsx`, `mount.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `Rules` connect `CLAUDE.md` to `useTranslatorFlow`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `useTranslatorFlow()` (e.g. with `closeSuggestion()` and `disableField()`) actually correct?**
  _`useTranslatorFlow()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13205128205128205 - nodes in this community are weakly interconnected._
- **Should `TranslatorWidget.stories.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `ToolbarPopup.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05276907001044932 - nodes in this community are weakly interconnected._