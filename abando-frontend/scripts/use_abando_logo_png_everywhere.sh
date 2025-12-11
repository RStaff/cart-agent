#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[logo-swap] Updating TSX to use /abando-logo.png …"

FILES=$(grep -RIl "abando-logo-transparent.png" \
  "$REPO_ROOT/app" "$REPO_ROOT/src" 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "[logo-swap] No files still using abando-logo-transparent.png"
  exit 0
fi

for f in $FILES; do
  tmp="$f.tmp.logo"
  sed 's#abando-logo-transparent.png#abando-logo.png#g' "$f" > "$tmp"
  mv "$tmp" "$f"
  echo "[logo-swap] Updated $f"
done

echo "[logo-swap] Done. All references now use /abando-logo.png."
