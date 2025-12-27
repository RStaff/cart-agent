#!/usr/bin/env bash
set -euo pipefail

PAGE="app/embedded/review/page.tsx"
LAYOUT="app/layout.tsx"

latest_bak () {
  ls -1t "$1".bak_* 2>/dev/null | head -n 1 || true
}

echo "🔎 Finding latest backups..."
PAGE_BAK="$(latest_bak "$PAGE")"
LAYOUT_BAK="$(latest_bak "$LAYOUT")"

if [[ -n "${PAGE_BAK:-}" ]]; then
  echo "♻️ Restoring $PAGE from $PAGE_BAK"
  cp "$PAGE_BAK" "$PAGE"
else
  echo "⚠️ No page backup found. Leaving $PAGE as-is."
fi

if [[ -n "${LAYOUT_BAK:-}" ]]; then
  echo "♻️ Restoring $LAYOUT from $LAYOUT_BAK"
  cp "$LAYOUT_BAK" "$LAYOUT"
else
  echo "⚠️ No layout backup found. If you see Polaris CSS import in app/layout.tsx, remove it manually."
fi

echo "✅ Revert complete."
