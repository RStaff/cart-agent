#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="web/.env"
test -f "$ENV_FILE" || { echo "❌ Missing $ENV_FILE"; exit 1; }

# Values from your Shopify Partners screenshot:
NEW_API_KEY="3ccb2f06b47804aaf63448a0e88d6dd7"
NEW_API_SECRET="87656349d0a6a1a85f7e661fef24cc2e"

TS="$(date +%s)"
BK="${ENV_FILE}.bak_${TS}"
cp "$ENV_FILE" "$BK"
echo "✅ Backup: $BK"

upsert_kv () {
  local key="$1"
  local val="$2"

  # Replace existing KEY=... or append if missing
  if grep -qE "^${key}=" "$ENV_FILE"; then
    perl -0777 -i -pe "s/^\\Q${key}\\E=.*/${key}=${val}/m" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

upsert_kv "SHOPIFY_API_KEY"    "$NEW_API_KEY"
upsert_kv "SHOPIFY_API_SECRET" "$NEW_API_SECRET"

echo "✅ Updated $ENV_FILE (API key + secret)."

# Print secret fingerprint (this must match server log secret_fp once server restarts)
python3 - <<PY
import hashlib
s = "${NEW_API_SECRET}"
print("LOCAL_SECRET_LEN =", len(s))
print("LOCAL_SECRET_FP  =", hashlib.sha256(s.encode()).hexdigest()[:12])
PY

echo
echo "Next: restart your dev server so it loads the new secret."
echo "Run (in another terminal if you want):"
echo "  pkill -f 'shopify app dev' || true"
echo "  cd web && shopify app dev"
