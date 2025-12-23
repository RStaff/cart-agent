#!/usr/bin/env bash
set -euo pipefail

stamp="$(date +%s)"

patch() {
  local file="$1" key="$2" val="$3"
  cp "$file" "$file.bak_${stamp}"
  if grep -qE "^${key}=" "$file"; then
    perl -0777 -pe "s/^${key}=.*$/\Q${key}\E=${val}/m" -i "$file"
  else
    printf "\n%s=%s\n" "$key" "$val" >> "$file"
  fi
  echo "✅ Updated $file (backup: $file.bak_${stamp})"
}

for f in ".env" "web/.env"; do
  [ -f "$f" ] || { echo "↪ Skipped (not found): $f"; continue; }
  patch "$f" "ABANDO_DEBUG_HMAC" "1"
  patch "$f" "ABANDO_ALLOW_INSECURE_WEBHOOKS" "0"
done
