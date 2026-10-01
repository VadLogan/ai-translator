# Graph Report - ai-translator-ext  (2026-10-01)

## Corpus Check
- 178 files · ~78,607 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1042 nodes · 2621 edges · 51 communities (45 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8fc4e5a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- background.ts
- TranslatorWidget.stories.tsx
- ToolbarPopup.tsx
- graphify skill (SKILL.md)
- app.ts
- useTranslatorFlow
- AI Translator API README
- ref_vitest
- contract.ts
- guard.ts
- scripts
- extension/package.json
- OptionsApp.tsx
- compilerOptions
- app.test.ts
- API architecture rules
- TranslatorWidget.tsx
- devDependencies
- icons.tsx
- compilerOptions
- imports
- Trigger.tsx
- Extension Icon 128px (translation speech bubbles)
- scripts
- Extension id pinning for OAuth redirect
- vitest.config.ts
- @tailwindcss/vite
- dependencies
- Home.stories.tsx
- ref_src_health_ts
- Translator.tsx
- fix-grammar/fix-grammar.ts
- buttons.tsx
- useTranslatorFlow.ts
- controllers/translate.ts
- selection.ts
- buttons.stories.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- api/package.json
- chunks.ts
- react
- toEdits.ts
- useActiveSite.ts
- Home.tsx
- controllers/rewrite.ts
- useUnderlines.ts
- replace.ts
- languages.ts
- isVerdict
- Languages

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 89 edges
2. `react` - 28 edges
3. `fail()` - 20 edges
4. `wholeField()` - 20 edges
5. `sendMessage()` - 20 edges
6. `HistoryEntry` - 19 edges
7. `graphify skill (SKILL.md)` - 19 edges
8. `findLanguage()` - 18 edges
9. `visibleEdits()` - 18 edges
10. `scopedLogger()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Rules` --references--> `sendMessage()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/messaging/messages.ts
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `Rules` --references--> `TranslatorWidget()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/TranslatorWidget.tsx
- `RewriteRecord` --references--> `RewriteOk`  [EXTRACTED]
  api/src/repositories/rewrites.ts → shared/contract.ts
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

## Communities (51 total, 6 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.12
Nodes (32): RFC-7636, ApiError, call(), check(), detect(), fixGrammar(), getSettings(), rewrite() (+24 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.05
Nodes (37): Busy, Error, estimate, FieldIcon, FieldIconChecking, FieldIconClean, FieldIconError, FieldIconErrors (+29 more)

### Community 2 - "ToolbarPopup.tsx"
Cohesion: 0.07
Nodes (33): useHistory(), usePinned(), Notice, Options, useTranslation(), EntryActions, HistoryCard(), History() (+25 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "app.ts"
Cohesion: 0.21
Nodes (14): app, getSettings(), putSettings(), requireUser(), userIdFrom(), validate(), hits, isRateLimited() (+6 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.15
Nodes (39): isProviderId(), replaceSelection(), getFieldAnchor(), wholeField(), sendMessage(), useTranslatorFlow(), apply(), checkField() (+31 more)

### Community 6 - "AI Translator API README"
Cohesion: 0.10
Nodes (21): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+13 more)

### Community 7 - "ref_vitest"
Cohesion: 0.06
Nodes (29): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+21 more)

### Community 8 - "contract.ts"
Cohesion: 0.14
Nodes (24): parseDetectBody(), parseFixGrammarBody(), parseRewriteBody(), parseSettings(), parseTranslateBody(), CorrectionRecord, correctionsRepository, ResponseMap (+16 more)

### Community 9 - "guard.ts"
Cohesion: 0.30
Nodes (10): guardText, typeSafeClient, COUNTS, grammarQuality(), GUARD_MESSAGES, GuardVerdict, toVerdict(), validateGuard() (+2 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "OptionsApp.tsx"
Cohesion: 0.07
Nodes (25): ProviderId, PROVIDERS, ICON_NAMES, Brand, Flags, Interface, meta, extension_src_core_languages_languages (+17 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "app.test.ts"
Cohesion: 0.20
Nodes (11): jwt(), userToken(), DetectionRecord, detectionsRepository, profilesRepository, rows, detectLang(), sql (+3 more)

### Community 15 - "API architecture rules"
Cohesion: 0.07
Nodes (31): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+23 more)

### Community 16 - "TranslatorWidget.tsx"
Cohesion: 0.15
Nodes (11): Anchor, LanguagesPanel(), BusyPanel(), ErrorPanel(), NotTextPanel(), SignInPanel(), Mark, Underlines() (+3 more)

### Community 17 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, happy-dom, storybook, @storybook/react-vite, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+4 more)

### Community 18 - "icons.tsx"
Cohesion: 0.06
Nodes (36): BrandMark(), fixed(), IconName, LANG_FLAG, PATHS, ref_flag_icons_flags_4x3_arab_svg_raw, ref_flag_icons_flags_4x3_bg_svg_raw, ref_flag_icons_flags_4x3_cn_svg_raw (+28 more)

### Community 19 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, noUncheckedIndexedAccess, strict, extends, ./.wxt/tsconfig.json

### Community 20 - "imports"
Cohesion: 0.33
Nodes (5): imports, hono, openai, postgres, @typesafe-ai/sdk

### Community 21 - "Trigger.tsx"
Cohesion: 0.24
Nodes (12): Badge, CountBadge(), clamp(), cornerStyle(), ICON_SIZE, iconStyle(), panelPosition(), Size (+4 more)

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
Cohesion: 0.07
Nodes (29): HISTORY, LATELY, noop(), now, PopupFrame(), Default, Empty, meta (+21 more)

### Community 30 - "Translator.tsx"
Cohesion: 0.14
Nodes (18): darkQuery(), followColorScheme(), subscribeDark(), usePrefersDark(), extension_src_components_theme, insertIntoFocusedField(), isInsertMessage(), main() (+10 more)

### Community 31 - "fix-grammar/fix-grammar.ts"
Cohesion: 0.22
Nodes (14): checkController(), detectController(), fixGrammarController(), rewriteController(), translateController(), fixGrammar(), applyEdits(), editSegments() (+6 more)

### Community 32 - "buttons.tsx"
Cohesion: 0.14
Nodes (22): ICON_SIZE, ICON_TONE, IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT, PillButton() (+14 more)

### Community 33 - "useTranslatorFlow.ts"
Cohesion: 0.10
Nodes (46): EditableSelection, plainText(), extension_src_core_languages_language, isCyrillic(), layoutLanguages(), RUSSIAN_ONLY, switchLayout(), toCyrillic (+38 more)

### Community 34 - "controllers/translate.ts"
Cohesion: 0.47
Nodes (6): TranslationRecord, translationsRepository, createInput(), translate(), TranslateBody, TranslateOk

### Community 35 - "selection.ts"
Cohesion: 0.15
Nodes (29): caretIn(), InsertMessage, caretIn(), deepActiveElement(), EXCLUDED_INPUT_MODES, fieldKey(), fieldLabel(), findContentEditableHost() (+21 more)

### Community 36 - "buttons.stories.tsx"
Cohesion: 0.40
Nodes (3): Icon, meta, Pill

### Community 39 - "api/package.json"
Cohesion: 0.08
Nodes (23): devDependencies, hono, @hono/node-server, openai, postgres, @types/node, @typesafe-ai/sdk, typescript (+15 more)

### Community 40 - "chunks.ts"
Cohesion: 0.29
Nodes (14): carryOver(), Chunk, cleanFix(), escapeHtml(), fixOf(), isBeingTyped(), isFinished(), mergeFixes() (+6 more)

### Community 41 - "react"
Cohesion: 0.17
Nodes (15): Group(), Row(), SubHeader(), Colours, meta, Scale, TONES, Text() (+7 more)

### Community 42 - "toEdits.ts"
Cohesion: 0.19
Nodes (11): diff(), Segment, escapeHtml(), fromSegments(), ModelEdit, overlaps(), Span, edits() (+3 more)

### Community 43 - "useActiveSite.ts"
Cohesion: 0.33
Nodes (7): isSiteDisabled(), parseSites(), activeTab(), Tab, useActiveSite(), settingsItem, storageSettings

### Community 44 - "Home.tsx"
Cohesion: 0.15
Nodes (19): IconButton(), Icon(), CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented() (+11 more)

### Community 45 - "controllers/rewrite.ts"
Cohesion: 0.33
Nodes (7): RewriteRecord, rewritesRepository, client, MODEL, rewrite(), STYLE, RewriteBody

### Community 46 - "useUnderlines.ts"
Cohesion: 0.38
Nodes (8): inside(), rangeRects(), textControlRects(), openSuggestion(), measure(), useUnderlines(), showsUnderlines(), visibleEdits()

### Community 47 - "replace.ts"
Cohesion: 0.47
Nodes (8): bareLink(), dispatchInput(), isLink(), replaceInContentEditable(), replaceInTextControl(), tryInsertText(), tryPaste(), withAtoms()

### Community 48 - "languages.ts"
Cohesion: 0.46
Nodes (6): browserLanguages(), findLanguage(), nativeName(), searchLanguages(), LanguageRow(), FAVORITES

### Community 49 - "isVerdict"
Cohesion: 0.36
Nodes (7): Response, ChunkRequests, drop(), pump(), use(), isVerdict(), Verdict

### Community 50 - "Languages"
Cohesion: 0.40
Nodes (3): ago(), Languages(), LanguagesProps

## Knowledge Gaps
- **266 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+261 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 373 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `buttons.tsx`, `useTranslatorFlow.ts`, `ToolbarPopup.tsx`, `buttons.stories.tsx`, `extension/package.json`, `Home.tsx`, `OptionsApp.tsx`, `useActiveSite.ts`, `API architecture rules`, `useUnderlines.ts`, `TranslatorWidget.tsx`, `icons.tsx`, `Trigger.tsx`, `Home.stories.tsx`, `Translator.tsx`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `Rules` connect `API architecture rules` to `useTranslatorFlow`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `useTranslatorFlow()` (e.g. with `closeSuggestion()` and `disableField()`) actually correct?**
  _`useTranslatorFlow()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12179487179487179 - nodes in this community are weakly interconnected._
- **Should `TranslatorWidget.stories.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `ToolbarPopup.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06696428571428571 - nodes in this community are weakly interconnected._