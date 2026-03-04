#!/usr/bin/env bash
set -euo pipefail

echo "=== BEFORE ==="
git status --porcelain || true

echo
echo "Reset tracked files to HEAD..."
git reset --hard HEAD

echo
echo "Remove untracked backup files created by patch scripts..."
# remove typical backup suffixes the scripts created
find . \
  -type f \
  \( -name '*.bak_toklog_*' -o -name '*.bak_samesite_*' \) \
  -print -delete || true

# also remove any stray *.bak_* created in repo root areas (be conservative: only inside web/src and .patch_backups)
find web/src .patch_backups .backup _bak_* _scratch 2>/dev/null \
  -type f \
  \( -name '*.bak_toklog_*' -o -name '*.bak_samesite_*' \) \
  -print -delete || true

echo
echo "Clean untracked files (safe in repo, but keep .env if present)..."
# This removes untracked files; if you keep local .env, exclude it.
git clean -fd -e .env -e .env.* || true

echo
echo "=== AFTER ==="
git status --porcelain || true
