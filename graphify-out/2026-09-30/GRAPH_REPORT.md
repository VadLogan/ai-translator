# Graph Report - ai-translator-ext  (2026-09-30)

## Corpus Check
- 172 files · ~72,163 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .example 2, .css 1)

## Summary
- 1001 nodes · 2462 edges · 42 communities (34 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ecffe601`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- background.ts
- TranslatorWidget.stories.tsx
- history.ts
- graphify skill (SKILL.md)
- contract.ts
- ToolbarPopup.tsx
- API architecture rules
- dev-gateway.ts
- OptionsPage.stories.tsx
- History.tsx
- scripts
- extension/package.json
- OptionsApp.tsx
- compilerOptions
- usePageEvents
- TranslatorWidget.tsx
- WidgetCallbacks
- devDependencies
- icons.tsx
- compilerOptions
- imports
- typography.tsx
- Extension Icon 128px (translation speech bubbles)
- scripts
- Extension id pinning for OAuth redirect
- vitest.config.ts
- @tailwindcss/vite
- dependencies
- Home.stories.tsx
- ref_src_health_ts
- Translator.tsx
- usePinned.ts
- buttons.tsx
- useTranslatorFlow.ts
- TranslatorWidget
- extension_src_ui_theme
- ref_ui_theme_css_inline
- ref_vitest
- HistoryEntry
- Home.tsx
- HomeProps
- replace.ts

## God Nodes (most connected - your core abstractions)
1. `useTranslatorFlow()` - 71 edges
2. `react` - 28 edges
3. `fail()` - 20 edges
4. `sendMessage()` - 20 edges
5. `HistoryEntry` - 19 edges
6. `graphify skill (SKILL.md)` - 19 edges
7. `findLanguage()` - 18 edges
8. `scopedLogger()` - 17 edges
9. `wholeField()` - 17 edges
10. `HomeProps` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Constraints that outrank tidiness` --references--> `usePageEvents()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/hooks/usePageEvents.ts
- `Rules` --references--> `sendMessage()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/messaging/messages.ts
- `Rules` --references--> `TranslatorWidget()`  [INFERRED]
  .claude/rules/extension-ui.md → extension/src/widgets/translator/TranslatorWidget.tsx
- `OptionsPageProps` --references--> `Language`  [EXTRACTED]
  extension/src/popups/options/OptionsPage.tsx → shared/contract.ts
- `Marked` --references--> `FixKind`  [EXTRACTED]
  extension/src/widgets/translator/hooks/useUnderlines.ts → shared/contract.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **API layered call chain** — _claude_rules_api_architecture_entrypoint_layer, _claude_rules_api_architecture_wiring_layer, _claude_rules_api_architecture_middleware_layer, _claude_rules_api_architecture_controller_layer, _claude_rules_api_architecture_service_layer, _claude_rules_api_architecture_repository_layer, _claude_rules_api_architecture_connection_layer [EXTRACTED 1.00]
- **Gateway-enforced auth model** — claude_verify_jwt_gate, claude_dev_gateway_emulation, claude_gateway_401_status_detection, api_readme_health_endpoint [EXTRACTED 1.00]
- **graphify build pipeline steps** — _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_extraction, _claude_skills_graphify_skill_build_cluster, _claude_skills_graphify_skill_community_labels, _claude_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Provider routes whose attempts join on trace_id** — api_readme_translate_endpoint, api_readme_detect_endpoint, claude_fix_grammar_route, claude_rewrite_route, claude_trace_id [EXTRACTED 1.00]
- **graphify graph refresh mechanisms** — _claude_skills_graphify_references_add_watch_watch, _claude_skills_graphify_references_hooks_post_commit_hook, _claude_skills_graphify_references_update_incremental_update [INFERRED 0.85]
- **Extension toolbar icon set (16/32/48/128)** — extension_public_icon_16_icon, extension_public_icon_32_icon, extension_public_icon_48_icon, extension_public_icon_128_icon [INFERRED 0.95]

## Communities (42 total, 8 thin omitted)

### Community 0 - "background.ts"
Cohesion: 0.14
Nodes (28): RFC-7636, ApiError, call(), check(), detect(), fixGrammar(), getSettings(), rewrite() (+20 more)

### Community 1 - "TranslatorWidget.stories.tsx"
Cohesion: 0.05
Nodes (37): Busy, Error, estimate, FAVORITES, FieldIcon, FieldIconChecking, FieldIconClean, FieldIconError (+29 more)

### Community 2 - "history.ts"
Cohesion: 0.19
Nodes (18): useTranslation(), History(), ToolbarPopup(), byDay(), byUse(), Common, defaultPair(), HISTORY_LIMIT (+10 more)

### Community 3 - "graphify skill (SKILL.md)"
Cohesion: 0.06
Nodes (44): .claude/CLAUDE.md (project instructions), Understood-as prompt rule, graphify reference: add URL and watch, graphify add URL ingest, graphify --watch auto-rebuild, graphify reference: exports and benchmark, Token reduction benchmark, FalkorDB export (+36 more)

### Community 4 - "contract.ts"
Cohesion: 0.05
Nodes (85): app, jwt(), userToken(), checkController(), detectController(), fixGrammarController(), rewriteController(), getSettings() (+77 more)

### Community 5 - "ToolbarPopup.tsx"
Cohesion: 0.18
Nodes (15): ProviderId, isMessage(), Message, Response, sendMessage(), activeTab(), Tab, useActiveSite() (+7 more)

### Community 6 - "API architecture rules"
Cohesion: 0.06
Nodes (46): API architecture rules, Connection layer (db.ts), Controller layer, A controller owns its own response, Entrypoint layer (index.ts, server.ts, health.ts), Erasable TypeScript constraint, Error body {error:{message, code}} synced with shared/contract.ts, http.ts shared helpers (fail, waitUntil, requestId, benchmark, AppEnv) (+38 more)

### Community 7 - "dev-gateway.ts"
Cohesion: 0.06
Nodes (42): devToken(), gateway, token(), ASYMMETRIC, base64url(), decodeJson(), DEV_JWT_SECRET, hmacKey() (+34 more)

### Community 8 - "OptionsPage.stories.tsx"
Cohesion: 0.18
Nodes (9): PROVIDERS, Failed, Loading, meta, Saved, Saving, SignedIn, SignedOut (+1 more)

### Community 9 - "History.tsx"
Cohesion: 0.12
Nodes (20): Icon(), SearchField(), Group(), Row(), SubHeader(), Text(), browserLanguages(), languageName() (+12 more)

### Community 10 - "scripts"
Cohesion: 0.11
Nodes (17): devDependencies, supabase, name, private, scripts, build, compile, db (+9 more)

### Community 11 - "extension/package.json"
Cohesion: 0.12
Nodes (16): description, typescript, vitest, name, private, type, version, flag-icons (+8 more)

### Community 12 - "OptionsApp.tsx"
Cohesion: 0.18
Nodes (9): isSiteDisabled(), parseSites(), Account, OptionsApp(), OptionsPage(), OptionsPageProps, DisabledField, disabledFields (+1 more)

### Community 13 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, module, moduleResolution, noEmit, noUncheckedIndexedAccess, rewriteRelativeImportExtensions (+5 more)

### Community 15 - "TranslatorWidget.tsx"
Cohesion: 0.17
Nodes (19): Badge, CountBadge(), Anchor, BusyPanel(), ErrorPanel(), NotTextPanel(), SignInPanel(), clamp() (+11 more)

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

### Community 21 - "typography.tsx"
Cohesion: 0.23
Nodes (9): Colours, meta, Scale, TONES, TEXT_TONE, TextTone, TextVariant, VARIANT (+1 more)

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
Cohesion: 0.15
Nodes (16): darkQuery(), followColorScheme(), subscribeDark(), usePrefersDark(), extension_src_components_theme, insertIntoFocusedField(), isInsertMessage(), main() (+8 more)

### Community 31 - "usePinned.ts"
Cohesion: 0.40
Nodes (4): usePinned(), item, pinnedLanguages, ref_wxt_utils_storage

### Community 32 - "buttons.tsx"
Cohesion: 0.11
Nodes (23): ICON_SIZE, ICON_TONE, IconButtonProps, Kbd(), KBD_TONE, PILL_SIZE, PILL_VARIANT, PillButton() (+15 more)

### Community 33 - "useTranslatorFlow.ts"
Cohesion: 0.05
Nodes (117): isProviderId(), caretIn(), InsertMessage, replaceSelection(), deepActiveElement(), EditableSelection, EXCLUDED_INPUT_MODES, fieldKey() (+109 more)

### Community 34 - "TranslatorWidget"
Cohesion: 0.40
Nodes (4): Constraints that outrank tidiness, Extension UI (`extension/src/`), Rules, TranslatorWidget()

### Community 42 - "ref_vitest"
Cohesion: 0.09
Nodes (22): request, toRow(), request, toRow(), request, toRow(), diff(), Segment (+14 more)

### Community 43 - "HistoryEntry"
Cohesion: 0.27
Nodes (5): Options, EntryActions, HistoryCard(), HistoryProps, HistoryEntry

### Community 44 - "Home.tsx"
Cohesion: 0.16
Nodes (17): IconButton(), CHIP_TONE, LanguageCard(), Meter(), RemovableChip(), Segmented(), Select(), StatusChip() (+9 more)

### Community 45 - "HomeProps"
Cohesion: 0.18
Nodes (3): Home(), HomeProps, Pair

### Community 46 - "replace.ts"
Cohesion: 0.47
Nodes (8): bareLink(), dispatchInput(), isLink(), replaceInContentEditable(), replaceInTextControl(), tryInsertText(), tryPaste(), withAtoms()

## Knowledge Gaps
- **266 isolated node(s):** `hono`, `openai`, `postgres`, `@typesafe-ai/sdk`, `DEV_JWT_SECRET` (+261 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 369 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `ToolbarPopup.tsx` to `buttons.tsx`, `useTranslatorFlow.ts`, `History.tsx`, `extension/package.json`, `Home.tsx`, `OptionsApp.tsx`, `usePageEvents`, `TranslatorWidget.tsx`, `icons.tsx`, `typography.tsx`, `Home.stories.tsx`, `Translator.tsx`, `usePinned.ts`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `Rules` connect `TranslatorWidget` to `ToolbarPopup.tsx`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `useTranslatorFlow()` (e.g. with `closeSuggestion()` and `disableField()`) actually correct?**
  _`useTranslatorFlow()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hono`, `openai`, `postgres` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `background.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14444444444444443 - nodes in this community are weakly interconnected._
- **Should `TranslatorWidget.stories.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `graphify skill (SKILL.md)` be split into smaller, more focused modules?**
  _Cohesion score 0.0613107822410148 - nodes in this community are weakly interconnected._