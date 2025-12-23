#!/usr/bin/env bash
set -euo pipefail

INBOX="${ABANDO_EVENT_INBOX_PATH:-$PWD/web/.abando_webhook_inbox.jsonl}"
test -f "$INBOX" || { echo "ERR: inbox not found: $INBOX" >&2; exit 1; }

# SERVER fp from latest inbox line that has secret_fp
SERVER_FP="$(
  tail -n 200 "$INBOX" \
  | perl -ne 'if(/"secret_fp":"([0-9a-f]+)"/){$fp=$1} END{print $fp||""}'
)"

# LOCAL fp from .env (SHOPIFY_API_SECRET or SHOPIFY_API_SECRET_KEY)
LOCAL_FP="$(
  node - <<'NODE'
import fs from "node:fs";
import crypto from "node:crypto";
function fp(s){ return crypto.createHash("sha256").update(String(s||""),"utf8").digest("hex").slice(0,12); }
function getVar(file,key){
  if (!fs.existsSync(file)) return "";
  const t = fs.readFileSync(file,"utf8");
  const m = t.match(new RegExp(`^${key}=(.*)$`,"m"));
  return (m?.[1]||"").trim();
}
const v =
  getVar("./.env","SHOPIFY_API_SECRET") ||
  getVar("./.env","SHOPIFY_API_SECRET_KEY") ||
  getVar("./web/.env","SHOPIFY_API_SECRET") ||
  getVar("./web/.env","SHOPIFY_API_SECRET_KEY") ||
  "";
process.stdout.write(v ? fp(v) : "");
NODE
)"

echo "SERVER secret_fp (from inbox) = ${SERVER_FP:-'(missing)'}"
echo "LOCAL  secret_fp (from .env)  = ${LOCAL_FP:-'(missing)'}"
echo

if [[ -z "${SERVER_FP:-}" || -z "${LOCAL_FP:-}" ]]; then
  echo "⚠️ Missing one of the fingerprints. (Is inbox logging enabled? Are env files populated?)"
  exit 1
fi

if [[ "$SERVER_FP" == "$LOCAL_FP" ]]; then
  echo "✅ MATCH: your signed tests SHOULD pass once tunnel is current."
else
  echo "❌ MISMATCH: the running server is verifying with a DIFFERENT secret."
  echo "   Fix: set your local SHOPIFY_API_SECRET to the secret of the *linked app* (the one running)."
fi
