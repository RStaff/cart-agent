#!/usr/bin/env bash
set -euo pipefail

stamp="$(date +%s)"

SRC=".env"
DST="web/.env"
KEY="DATABASE_URL"

[ -f "$SRC" ] || { echo "❌ Missing $SRC"; exit 1; }
[ -f "$DST" ] || { echo "❌ Missing $DST"; exit 1; }

src_line="$(grep -E "^${KEY}=" "$SRC" | tail -n 1 || true)"
[ -n "$src_line" ] || { echo "❌ ${KEY} not found in $SRC"; exit 1; }

cp "$DST" "${DST}.bak_${stamp}"

# remove any existing DATABASE_URL lines from web/.env, then append the good one
perl -0777 -i -pe "s/^${KEY}=.*\\n//mg" "$DST"
printf "\n%s\n" "$src_line" >> "$DST"

echo "✅ Synced ${KEY} from $SRC -> $DST (backup: ${DST}.bak_${stamp})"
