#!/usr/bin/env bash
set -euo pipefail

# Abando – Step 2: Daily readiness, then commit + push embedded shell

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "======================================"
echo " Abando – Build, Commit & Push Embed "
echo "======================================"
echo "Repo root : $ROOT"
echo "Branch    : $BRANCH"
echo

# 1) Run your daily readiness (prod sanity + local build smoke)
if [ -x "scripts/abando_daily_readiness.sh" ]; then
  echo "→ 1) Running scripts/abando_daily_readiness.sh"
  echo
  scripts/abando_daily_readiness.sh
else
  echo "⚠️ scripts/abando_daily_readiness.sh not found or not executable"
  echo "   (Skipping readiness checks.)"
fi

echo
echo "→ 2) Staging embedded shell page.tsx"
git add abando-frontend/app/embedded/page.tsx

if git diff --cached --quiet; then
  echo "ℹ️ No staged changes after add; nothing to commit."
  exit 0
fi

COMMIT_MSG="embed: reset /embedded shell page"
echo "→ 3) Committing with message:"
echo "   $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

echo
echo "→ 4) Pushing to origin $BRANCH"
git push origin "$BRANCH"

echo
echo "================================"
echo "  Embedded shell commit pushed  "
echo "================================"
