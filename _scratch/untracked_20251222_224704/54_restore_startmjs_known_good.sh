#!/usr/bin/env bash
set -euo pipefail

FILE="web/start.mjs"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "🔎 Finding a known-good backup for $FILE ..."

mapfile -t BKS < <(ls -t web/start.mjs.bak_* 2>/dev/null || true)
if [ ${#BKS[@]} -eq 0 ]; then
  echo "❌ No backups found: web/start.mjs.bak_*"
  exit 1
fi

echo "📦 Backups found:"
printf '  - %s\n' "${BKS[@]}"

TMP="$(mktemp -t startmjs.XXXXXX.mjs)"
GOOD=""

for bk in "${BKS[@]}"; do
  cp "$bk" "$TMP"
  # Syntax check
  if node --check "$TMP" >/dev/null 2>&1; then
    # Light sanity check: should contain server.listen
    if grep -q "server.listen" "$TMP"; then
      GOOD="$bk"
      break
    fi
  fi
done

rm -f "$TMP"

if [ -z "${GOOD:-}" ]; then
  echo "❌ No backup passed syntax check + contains server.listen"
  echo "   Next: paste 'nl -ba web/start.mjs | sed -n 1,120p'"
  exit 1
fi

echo "✅ Using known-good backup: $GOOD"

# backup current broken file
cp "$FILE" "$FILE.broken_$(date +%Y%m%d_%H%M%S)" || true

# restore good
cp "$GOOD" "$FILE"

echo "✅ Restored: $FILE"
echo
echo "--- quick verify ---"
node --check "$FILE"
echo "✅ node --check passed"

echo
echo "NEXT:"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/dev.sh cart-agent-dev.myshopify.com"
echo "  3) tail -n 120 .dev_express.log"
