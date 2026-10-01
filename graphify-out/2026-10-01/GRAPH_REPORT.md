# Graph Report - ai-translator-ext  (2026-10-01)

## Corpus Check
- 178 files · ~78,426 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1041 nodes · 2618 edges · 45 communities (37 shown, 8 thin omitted)
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
- dev-gateway.ts
- contract.ts
- app.test.ts
- scripts
- extension/package.json
- OptionsApp.tsx
- compilerOptions
- messages.ts
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
- view.ts
- controllers/translate.ts
- CLAUDE.md
- buttons.stories.tsx
- extension_src_ui_theme
- ref_ui_theme_css_inline
- usePageEvents
- app
- react
- toEdits.ts
- Home.tsx
- TranslatorWidget

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 89 edges
2. `react` - 28 edges
3. `fail()` - 20 edges
4. `wholeField()` - 20 edges
5. `sendMessage()` - 20 edges
6. `HistoryEntry` - 19 edges
7. `graphify skill (SKILL.md)` - 19 edges
8. `findLanguage()` - 18 edges
9. `scopedLogger()` - 17 edges
10. `HomeProps` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `Rules` --references--> `sendMessage()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/messaging/messages.ts
- `Rules` --references--> `TranslatorWidget()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/TranslatorWidget.tsx
- `DetectionRecord` --references--> `DetectBody`  [EXTRACTED]
  api/src/repositories/detections.ts → shared/contract.ts
- `RewriteRecord` --references--> `RewriteBody`  [EXTRACTED]
  api/src/repositories/rewrites.ts → shared/contract.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (45 total, 8 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.12
Nodes (31): RFC-7636, ApiError, call(), check(), detect(), fixGrammar(), getSettings(), rewrite() (+23 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.05
Nodes (36): Busy, Error, estimate, FieldIcon, FieldIconChecking, FieldIconClean, FieldIconError, FieldIconErrors (+28 more)

### Community 2 - "ToolbarPopup.tsx"
Cohesion: 0.07
Nodes (33): useHistory(), usePinned(), Notice, Options, useTranslation(), EntryActions, HistoryCard(), History() (+25 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "app.ts"
Cohesion: 0.20
Nodes (23): checkController(), detectController(), fixGrammarController(), rewriteController(), translateController(), requireUser(), userIdFrom(), validate() (+15 more)

### Community 5 - "useTranslatorFlow"
Cohesion: 0.05
Nodes (108): isProviderId(), caretIn(), insertIntoFocusedField(), InsertMessage, bareLink(), dispatchInput(), isLink(), replaceInContentEditable() (+100 more)

### Community 6 - "AI Translator API README"
Cohesion: 0.10
Nodes (21): AI Translator API README, POST /detect, deno.json + devDependencies dual lists, API error shape {error:{message,code}}, GET /health, Per-user in-memory rate limit (60/min), GET/PUT /settings, POST /translate (+13 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.06
Nodes (43): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+35 more)

### Community 8 - "contract.ts"
Cohesion: 0.12
Nodes (24): getSettings(), putSettings(), parseDetectBody(), parseFixGrammarBody(), parseRewriteBody(), parseSettings(), parseTranslateBody(), profilesRepository (+16 more)

### Community 9 - "app.test.ts"
Cohesion: 0.17
Nodes (16): jwt(), userToken(), guardText, client, MODEL, typeSafeClient, detectLang(), COUNTS (+8 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "OptionsApp.tsx"
Cohesion: 0.07
Nodes (29): ProviderId, PROVIDERS, ICON_NAMES, Brand, Flags, Interface, meta, extension_src_core_languages_languages (+21 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 14 - "messages.ts"
Cohesion: 0.14
Nodes (15): DetectionRecord, detectionsRepository, request, toRow(), RewriteRecord, rewritesRepository, request, toRow() (+7 more)

### Community 15 - "API architecture rules"
Cohesion: 0.18
Nodes (19): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+11 more)

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
Cohesion: 0.11
Nodes (20): darkQuery(), followColorScheme(), subscribeDark(), usePrefersDark(), extension_src_components_theme, isInsertMessage(), main(), OptionsApp() (+12 more)

### Community 31 - "fix-grammar/fix-grammar.ts"
Cohesion: 0.22
Nodes (10): CorrectionRecord, correctionsRepository, request, toRow(), fixGrammar(), applyEdits(), editSegments(), FIX_KINDS (+2 more)

### Community 32 - "buttons.tsx"
Cohesion: 0.14
Nodes (22): ICON_SIZE, ICON_TONE, IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT, PillButton() (+14 more)

### Community 33 - "view.ts"
Cohesion: 0.07
Nodes (50): EditableSelection, browserLanguages(), findLanguage(), extension_src_core_languages_language, nativeName(), searchLanguages(), isCyrillic(), layoutLanguages() (+42 more)

### Community 34 - "controllers/translate.ts"
Cohesion: 0.35
Nodes (7): request, toRow(), TranslationRecord, createInput(), translate(), TranslateBody, TranslateOk

### Community 35 - "CLAUDE.md"
Cohesion: 0.29
Nodes (6): Typed background-worker messaging protocol, Closed shadow-root translator widget, Extension is frontend only, Layered API architecture, Paste-first selection replacement, AI Translator playground page

### Community 36 - "buttons.stories.tsx"
Cohesion: 0.40
Nodes (3): Icon, meta, Pill

### Community 41 - "react"
Cohesion: 0.17
Nodes (15): Group(), Row(), SubHeader(), Colours, meta, Scale, TONES, Text() (+7 more)

### Community 42 - "toEdits.ts"
Cohesion: 0.16
Nodes (14): diff(), Segment, escapeHtml(), fromSegments(), ModelEdit, overlaps(), Span, edits() (+6 more)

### Community 44 - "Home.tsx"
Cohesion: 0.15
Nodes (19): IconButton(), Icon(), CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), SearchField(), Segmented() (+11 more)

### Community 46 - "TranslatorWidget"
Cohesion: 0.40
Nodes (4): Constraints that outrank tidiness, Extension UI (`extension/src/`), Rules, TranslatorWidget()

## Knowledge Gaps
- **265 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+260 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 372 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `buttons.tsx`, `ToolbarPopup.tsx`, `buttons.stories.tsx`, `useTranslatorFlow`, `usePageEvents`, `extension/package.json`, `Home.tsx`, `OptionsApp.tsx`, `TranslatorWidget.tsx`, `icons.tsx`, `Trigger.tsx`, `Home.stories.tsx`, `Translator.tsx`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `Rules` connect `TranslatorWidget` to `useTranslatorFlow`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `useTranslatorFlow()` (e.g. with `closeSuggestion()` and `disableField()`) actually correct?**
  _`useTranslatorFlow()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _265 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12435897435897436 - nodes in this community are weakly interconnected._
- **Should `TranslatorWidget.stories.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `ToolbarPopup.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06696428571428571 - nodes in this community are weakly interconnected._