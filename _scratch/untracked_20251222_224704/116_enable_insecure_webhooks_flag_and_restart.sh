#!/usr/bin/env bash
set -euo pipefail

ENVFILE="web/.env"
KEY="ABANDO_ALLOW_INSECURE_WEBHOOKS"

test -f "$ENVFILE" || { echo "❌ Missing: $ENVFILE"; exit 1; }

stamp="$(date +%s)"
cp "$ENVFILE" "${ENVFILE}.bak_${stamp}"
echo "✅ Backup: ${ENVFILE}.bak_${stamp}"

# Remove existing KEY lines (if any), then append the correct value
perl -0777 -i -pe "s/^${KEY}=.*\\n//mg" "$ENVFILE"
printf "\n%s=1\n" "$KEY" >> "$ENVFILE"

echo "🔎 Confirm:"
grep -n "^${KEY}=" "$ENVFILE" || true

echo
echo "🔁 Restart dev stack"
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true
./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "✅ Status:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:3001 -sTCP:LISTEN || true
