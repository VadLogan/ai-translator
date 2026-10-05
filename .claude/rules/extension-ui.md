# Extension UI (`extension/src/`)

Each surface is a thin container, hooks that hold the logic, a pure mapping, and presentational
pieces. Behavior lives in hooks; markup lives in components that take props and callbacks only.

```
entrypoints/            WXT only: createRoot / defineContentScript, nothing else
components/             reusable, presentational: buttons, icons, inputs, typography, menu, list, CountBadge, GrammarPanel, Recording, theme.css, color-scheme
widgets/translator/     the in-page widget
  mount.ts              the closed shadow host
  Translator.tsx        container: useTranslatorFlow → toView → <TranslatorWidget>
  hooks/                useTranslatorFlow (the flow), usePageEvents (listener table), useSiteGate, requestSlot
  state.ts view.ts position.ts   pure, each with its test
  TranslatorWidget.tsx Trigger.tsx panels/   presentational, stories beside them
popups/toolbar/         the toolbar popup
  ToolbarPopup.tsx      container: composes hooks, picks the screen
  hooks/                useTranslation, useHistory, useActiveSite, usePinned, useDictation, useGrammarFix
  screens/              Home, History, Languages, entries (HistoryRow, HistoryCard); stories beside each
popups/settings/        the settings page (options.html)
  SettingsApp.tsx       container: composes hooks
  hooks/                useAccount, useSettings, useDisabledFields, useMicPermission, useShortcuts, useHash, useVocabulary
  SettingsPage.tsx AddLanguage.tsx Vocabulary.tsx   presentational, story beside the page
content/                DOM domain logic shared by the widget and the popup's Insert: selection, replace, insert
core/                   pure logic shared by the surfaces, each file with its test: languages, layout, sites,
                        fixEdits (fix helpers), pcm, liveTranscript, liveLanguage, sentenceFixes (voice input)
entrypoints/offscreen/  the one mic recorder (not UI): driven by the worker, never imported by a surface
```

## Rules

- **`components/` never imports** `messaging/`, `settings/`, `auth/`, `content/` or `wxt/*`. Props in, callbacks out.
- **Screens, panels and `TranslatorWidget` are presentational**: no `sendMessage`, no storage, no timers. Each gets a story.
- **Hooks own `sendMessage`, storage and timers.** Containers only compose hooks and pass props; nothing in a container needs a comment about *how* it works.
- **Props are narrow.** A screen declares what it renders; never spread one big props object into every screen.
- **Pure logic gets a test** (`state.ts`, `view.ts`, `position.ts`, `requestSlot.ts`, `settings/history.ts`). Hooks are covered through them and through the playground.
- A piece moves to `components/` once a **second** surface uses it, not before. Logic does the same into `core/` (it moved `mergeFixes` & co. out of `widgets/translator/chunks.ts`, which re-exports them so its callers and tests didn't change). `core/` never imports a surface; it may take a sender as a parameter (`liveLanguage(ask)`, `sentenceFixes(ask, cancel)`) so it stays testable without `chrome.*`.
- **A once-subscribed listener calls the latest callbacks through a ref** (`useDictation`'s `latest`): a handler from the first render holds stale props (it once looked up the language pair in an outdated history).

## Constraints that outrank tidiness

- The widget's page listeners are **subscribed once** (`usePageEvents`), and every handler reads state through the `latest` ref. Don't make them depend on render state: re-subscribing loses events in Teams/CKEditor.
- `preventDefault` on `mousedown` inside the shadow root (`mount.ts`) keeps focus in the page's field. Keep it.
