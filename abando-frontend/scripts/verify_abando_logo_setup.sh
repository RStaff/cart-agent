#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[logo-verify] Public logo files:"
for f in abando-logo-transparent.png abando-logo.png abando-logo.inline.png abando-logo.inline.backup.png; do
  if [ -f "$REPO_ROOT/public/$f" ]; then
    dims=$(sips -g pixelWidth -g pixelHeight "$REPO_ROOT/public/$f" 2>/dev/null \
           | awk '/pixelWidth|pixelHeight/ {print $2}' | paste -sd'x' -)
    echo "  $f  (${dims})"
  fi
done

echo
echo "[logo-verify] Code references:"
grep -RIn "abando-logo" "$REPO_ROOT/app" "$REPO_ROOT/src" 2>/dev/null || echo "  (none)"
