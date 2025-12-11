#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[logo-fix] Repo root: $REPO_ROOT"
echo "[logo-fix] Updating code to use /abando-logo-transparent.png (small, transparent)…"
echo

# Collect all files that mention "abando-logo"
FILES=$(grep -RIl "abando-logo" "$REPO_ROOT/app" "$REPO_ROOT/src" 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "[logo-fix] No files reference Abando logo; nothing to change."
  exit 0
fi

for f in $FILES; do
  echo "[logo-fix] Patching $f"

  # 1) Make sure they all point at the transparent PNG
  gsed -i \
    -e 's#abando-logo.inline.png#abando-logo-transparent.png#g' \
    -e 's#abando-logo.png#abando-logo-transparent.png#g' \
    "$f"

  # 2) Shrink any large hard-coded dimensions for that logo
  gsed -i \
    -e 's/width={160}/width={32}/g' \
    -e 's/height={40}/height={30}/g' \
    -e 's/width={140}/width={32}/g' \
    -e 's/height={32}/height={30}/g' \
    "$f"
done

echo
echo "[logo-fix] ✅ All Abando logo references now use /abando-logo-transparent.png with smaller dimensions."
