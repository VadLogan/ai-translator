---
name: extension-release
description: Prepare a release of the AI Translator Chrome extension. Diffs extension code since the last released version, summarizes what changed, proposes a version bump (major / minor / patch / alpha) with reasoning, then updates the version in extension/package.json and the extension description in extension/wxt.config.ts. Use when the user says "bump version", "prepare release", "new version", "update extension description", "what changed since last version", or invokes /extension-release.
---

# Extension Release

Goal: understand what changed since the last released version, propose the right version bump, and update the version and description. Never commit, tag, zip, or run `npm run deploy` unless the user asks.

## Where things live (WXT project)

- There is no hand-written `manifest.json`. WXT generates `extension/output/chrome-mv3/manifest.json` at build time.
- **Version** comes from `extension/package.json` `version`. WXT copies it into the manifest.
- **Description**: `manifest.description` in `extension/wxt.config.ts` is what Chrome shows. Keep `extension/package.json` `description` in sync with it.
- The root `package.json` version is the workspace root. Leave it alone unless the user asks.
- Extension code is `extension/` plus `shared/` (code shared with the API). `api/` and `supabase/` changes don't ship in the extension. Mention them only as context.

## 1. Find the baseline

Current version = `extension/package.json` `version`. The baseline is the last released state, first match wins:
1. A git tag for that version: `git tag --list 'v<version>' '<version>'`
2. The latest tag: `git describe --tags --abbrev=0`
3. The commit that last changed the version: `git log -1 --format=%H -G'"version"' -- extension/package.json`

Tell the user which baseline you used. If it's the commit that added the file (the version never changed), say this is the first release and the diff covers everything. Include uncommitted changes too (`git status`, `git diff HEAD -- extension shared`).

## 2. Understand the differences

```bash
git log --oneline <baseline>..HEAD -- extension shared
git diff --stat <baseline>..HEAD -- extension shared ':!**/package-lock.json' ':!extension/output' ':!extension/storybook-static'
git diff <baseline>..HEAD -- extension/wxt.config.ts
```

Read the actual diffs of the meaningful files in `extension/src` and `shared`, not just the commit messages. Group the changes:

- **Breaking**: new `permissions` or `host_permissions` in `wxt.config.ts` (Chrome turns the extension off until the user approves them again). Also a removed feature or option, or a changed format for settings and history in `chrome.storage` with no migration. Also an API contract the extension relies on that changed in a way older builds can't handle.
- **Features**: a new user-visible capability, such as a new widget action, popup or options setting, language, voice/grammar/translate behavior, or entrypoint.
- **Fixes**: bug fixes, performance, UI/UX polish, refactors, tests, dependencies, Storybook. Nothing new for the user.

## 3. Propose the bump

The project is pre-1.0 (`0.x`), so semver shifts down one level until the user declares 1.0:

| Bump | When | Example from 0.1.0 |
|------|------|------|
| **major** | Breaking change. While on 0.x, propose a minor bump instead unless the user wants to go to 1.0. | `1.0.0` |
| **minor** | New features (or breaking changes while on 0.x). | `0.2.0` |
| **patch** | Only fixes and internal changes. | `0.1.1` |
| **alpha** | A test build before the next release, or unfinished work. | `0.2.0-alpha.1` |

How alpha versions work with WXT: `extension/package.json` gets `0.2.0-alpha.1`. WXT turns that into manifest `version: "0.2.0"` and `version_name: "0.2.0-alpha.1"`. The next alpha is `-alpha.2`, and the release drops the suffix. Caveat: every alpha of 0.2.0 has the same manifest `version`. The Chrome Web Store rejects re-uploading a version it already has, so only one alpha per target can go to the store. Warn the user when they choose alpha and mean to deploy.

Show a short summary of the changes (3–8 bullets, grouped as above). Then ask with AskUserQuestion: the options are major, minor, patch and alpha, each labeled with the resulting version. Put your recommendation first with "(Recommended)" and a one-line reason. If the user passed a bump type as an argument, skip asking.

## 4. Update the description

Draft a `description` that describes the extension as it is now (what it does, not a changelog):
- Chrome Web Store limit: **132 characters max**. Count it.
- Plain text. No emoji, version numbers or "new!".
- If nothing user-visible changed, keep the current text and say so.

Show the old and new description and let the user adjust it before writing.

## 5. Write the changes

Run from the repo root:

```bash
npm version <new-version> --no-git-tag-version -w extension
```

This updates `extension/package.json` and the lockfile. Then edit `manifest.description` in `extension/wxt.config.ts` and `description` in `extension/package.json`.

Verify:

```bash
npm run compile -w extension
npm run build -w extension
grep -oE '"(version|version_name|description)":"[^"]*"' extension/output/chrome-mv3/manifest.json
```

## 6. Report

One block: old → new version, the manifest `version`/`version_name` from the build, the new description with its character count, and the files changed. Then offer to commit `chore(extension): release v<version>` and tag `v<version>`. Do it only on a yes. Tags also give the next run a clean baseline.
