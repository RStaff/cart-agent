#!/usr/bin/env bash
set -euo pipefail

INBOX="${ABANDO_EVENT_INBOX_PATH:-$PWD/web/.abando_webhook_inbox.jsonl}"
test -f "$INBOX" || { echo "❌ Missing inbox: $INBOX"; exit 1; }

# Load .env (repo root) into this shell so we can fingerprint what YOU think the secret is
if [[ -f "$PWD/.env" ]]; then
  set -a
  source "$PWD/.env"
  set +a
fi

fp12() {
  node - <<'NODE'
import crypto from "node:crypto";
const s = process.env.S || "";
process.stdout.write(
  crypto.createHash("sha256").update(String(s),"utf8").digest("hex").slice(0,12)
);
NODE
}

LOCAL_SECRET="${SHOPIFY_API_SECRET:-${SHOPIFY_API_SECRET_KEY:-}}"
LOCAL_FP="(missing)"
if [[ -n "${LOCAL_SECRET}" ]]; then
  export S="$LOCAL_SECRET"
  LOCAL_FP="$(fp12)"
fi

# Get latest verified line with secret_fp
SERVER_FP="$(tail -n 200 "$INBOX" | rg '"stage":"verified"' | tail -n 1 | node - <<'NODE'
let data="";
process.stdin.on("data",d=>data+=d);
process.stdin.on("end",()=>{
  const line = data.trim();
  if (!line) { console.log("(missing)"); process.exit(0); }
  try {
    const o = JSON.parse(line);
    console.log(o.secret_fp || "(missing)");
  } catch {
    console.log("(unparseable)");
  }
});
NODE
)"

echo "LOCAL  fp (from .env)         = $LOCAL_FP"
echo "SERVER fp (from inbox secret_fp)= $SERVER_FP"
echo

if [[ "$LOCAL_FP" == "$SERVER_FP" ]]; then
  echo "✅ MATCH: your signed tests SHOULD be able to pass now."
else
  echo "❌ MISMATCH: your server is using a different secret than your .env."
  echo "   Fix: paste the correct API secret key for the *linked app* and re-sync env."
fi
