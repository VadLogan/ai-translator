#!/usr/bin/env bash
# Prints what the code actually declares, for comparison against the docs.
# Usage (from anywhere in the repo): bash .claude/skills/update-project-docs/inventory.sh [base-ref]
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
base=${1:-HEAD}

section() { printf '\n## %s\n' "$1"; }

section "Changed files vs $base (incl. untracked)"
{ git diff --name-status "$base" -- . ':!graphify-out' ':!package-lock.json' ':!*/package-lock.json'
  git ls-files --others --exclude-standard -- . ':!graphify-out' | sed 's/^/?\t/'; } | sort -u

section "API routes (api/src/app.ts)"
grep -oE "app\.(get|post|put|patch|delete)\('[^']+'" api/src/app.ts | awk -F"[.('']" '{print toupper($2), $4}'

section "Error codes (shared/contract.ts)"
grep -oE "export type ApiErrorCode = .*" shared/contract.ts

section "Extension message types (extension/src/messaging/messages.ts)"
grep -oE "type: '[a-z-]+'" extension/src/messaging/messages.ts | sort -u | tr '\n' ' '; echo

section "chrome.storage keys (defineItem)"
grep -rhoE "defineItem<[^>]+>\('[^']+'" extension/src | sed -E "s/.*\('//; s/'$//" | sort -u

section "API env vars (env('...'))"
grep -rhoE "env\('[A-Z_]+'\)" api | sed -E "s/env\('//; s/'\)//" | sort -u | tr '\n' ' '; echo

section "Extension env vars (import.meta.env.WXT_*)"
grep -rhoE "import\.meta\.env\.WXT_[A-Z_]+" extension/src | sed 's/import\.meta\.env\.//' | sort -u | tr '\n' ' '; echo

section "Manifest permissions / host_permissions (extension/wxt.config.ts)"
grep -E "^\s*(permissions|'http|'https)" extension/wxt.config.ts | sed 's/^ *//'

section "Migrations (supabase/migrations)"
ls supabase/migrations

section "supabase/config.toml paths that do not exist"
grep -E '^(entrypoint|import_map) *=' supabase/config.toml | sed -E 's/.*"(.*)"/\1/' | while read -r p; do
  [ -e "supabase/$p" ] || echo "MISSING supabase/$p"
done

section "Source folders"
find api/src api/dev extension/src -type d -not -path '*/node_modules*' | sort

section "Paths named in docs that do not exist"
# `src/...` and `dev/...` are tried under both workspaces, since the docs drop the prefix.
for doc in CLAUDE.md .claude/CLAUDE.md .claude/rules/*.md docs/*.md; do
  [ -f "$doc" ] || continue
  grep -oE '`(api/|extension/|shared/|supabase/|src/|dev/)[A-Za-z0-9_./-]+\.(ts|tsx|sql|toml|json|md|css)`' "$doc" | tr -d '`' | sort -u | while read -r p; do
    [ -e "$p" ] || [ -e "api/$p" ] || [ -e "extension/$p" ] || echo "$doc: $p"
  done
done
