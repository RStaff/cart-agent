#!/usr/bin/env bash
set -euo pipefail

ENVFILE="web/.env"
test -f "$ENVFILE" || { echo "❌ Missing $ENVFILE"; exit 1; }
cp "$ENVFILE" "$ENVFILE.bak_$(date +%s)"

# If token exists, print it and exit
if rg -q '^ABANDO_DEV_SIGN_TOKEN=' "$ENVFILE"; then
  echo "ℹ️ ABANDO_DEV_SIGN_TOKEN already present in $ENVFILE"
  rg '^ABANDO_DEV_SIGN_TOKEN=' "$ENVFILE" || true
  exit 0
fi

TOKEN="$(node -e 'console.log(require("node:crypto").randomBytes(18).toString("hex"))')"
printf "\nABANDO_DEV_SIGN_TOKEN=%s\n" "$TOKEN" >> "$ENVFILE"
echo "✅ Added ABANDO_DEV_SIGN_TOKEN to $ENVFILE"
echo "ABANDO_DEV_SIGN_TOKEN=$TOKEN"
