#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/310_sync_shopify_secret_no_manual_edit.sh
#   ./scripts/310_sync_shopify_secret_no_manual_edit.sh "<SECRET>"
#
# Writes SHOPIFY_API_SECRET into:
#   - .env
#   - web/.env
# with timestamped backups, then prints fingerprints for verification.

ROOT="$(pwd)"
test -f "$ROOT/shopify.app.toml" || { echo "❌ Run this from repo root (cart-agent)."; exit 1; }

SECRET="${1:-${SHOPIFY_API_SECRET:-}}"
if [[ -z "${SECRET}" ]]; then
  echo "Paste your Shopify *API secret key* (input hidden), then press Enter:"
  read -r -s SECRET
  echo
fi

if [[ -z "${SECRET}" ]]; then
  echo "❌ Secret is empty. Aborting."
  exit 1
fi

ts="$(date +%s)"

fp() {
  node - <<'NODE'
import crypto from "node:crypto";
const s = process.env.S || "";
const out = crypto.createHash("sha256").update(s, "utf8").digest("hex").slice(0, 12);
process.stdout.write(out);
NODE
}

upsert_var () {
  local file="$1" key="$2" val="$3"

  mkdir -p "$(dirname "$file")" 2>/dev/null || true
  touch "$file"

  local bk="${file}.bak_${ts}"
  cp "$file" "$bk"
  echo "🧾 Backup: $bk"

  # If key exists, replace; else append.
  if rg -n "^${key}=" "$file" >/dev/null 2>&1; then
    perl -i -pe "s/^${key}=.*/${key}=${val}/" "$file"
  else
    printf "\n%s=%s\n" "$key" "$val" >> "$file"
  fi
}

echo "🔧 Writing SHOPIFY_API_SECRET into .env + web/.env ..."
upsert_var "$ROOT/.env"     "SHOPIFY_API_SECRET" "$SECRET"
upsert_var "$ROOT/web/.env" "SHOPIFY_API_SECRET" "$SECRET"

export S="$SECRET"
SECRET_FP="$(fp)"

echo
echo "✅ Done."
echo "🔎 Secret fingerprint (sha256 first 12) = $SECRET_FP"
echo "🔎 File proof:"
node - <<'NODE'
import fs from "node:fs";
import crypto from "node:crypto";

function fp(v){
  return crypto.createHash("sha256").update(String(v||""),"utf8").digest("hex").slice(0,12);
}
function getVar(file,key){
  const t = fs.readFileSync(file,"utf8");
  const m = t.match(new RegExp(`^${key}=(.*)$`,"m"));
  return (m?.[1]||"").trim();
}

for (const f of [".env","web/.env","web/.env.local",".env.local"]) {
  if (!fs.existsSync(f)) continue;
  const v = getVar(f,"SHOPIFY_API_SECRET") || getVar(f,"SHOPIFY_API_SECRET_KEY");
  console.log(f.padEnd(14), "hasSecret=", !!v, "fp=", v ? fp(v) : "(missing)");
}
NODE

echo
echo "ℹ️ If your running server still shows a different secret_fp in the webhook inbox,"
echo "   restart 'shopify app dev' so Node picks up the new env."
