#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   printf '%s' 'PASTE_SECRET_HERE' | ./scripts/320_set_shopify_secret_from_stdin.sh
#
# Writes to .env + web/.env with backups. NO manual file editing.

read -r SECRET || true
SECRET="${SECRET:-}"
SECRET="${SECRET//$'\r'/}"
SECRET="$(printf "%s" "$SECRET" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"

if [[ -z "$SECRET" ]]; then
  echo "ERR: no secret provided on stdin." >&2
  echo "Example: printf '%s' 'YOUR_SECRET' | $0" >&2
  exit 1
fi

stamp="$(date +%s)"
for f in ".env" "web/.env"; do
  mkdir -p "$(dirname "$f")"
  [[ -f "$f" ]] && cp "$f" "$f.bak_$stamp" || true
  if [[ -f "$f" ]] && rg -n '^SHOPIFY_API_SECRET=' "$f" >/dev/null 2>&1; then
    perl -pi -e 's/^SHOPIFY_API_SECRET=.*/SHOPIFY_API_SECRET='"$SECRET"'/m' "$f"
  else
    printf "\nSHOPIFY_API_SECRET=%s\n" "$SECRET" >> "$f"
  fi
done

SECRET="$SECRET" node - <<'NODE'
import crypto from "node:crypto";
const s = process.env.SECRET;
const fp = crypto.createHash("sha256").update(s,"utf8").digest("hex").slice(0,12);
console.log("✅ Wrote SHOPIFY_API_SECRET to .env + web/.env");
console.log("✅ secret_fp =", fp);
NODE
