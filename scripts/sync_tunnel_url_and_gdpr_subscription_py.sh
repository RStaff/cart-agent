#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TOML="$ROOT/shopify.app.toml"

URL="${TRYCLOUDFLARE_URL:-}"
if [[ -z "$URL" ]]; then
  echo "❌ TRYCLOUDFLARE_URL not set."
  echo '✅ Example: TRYCLOUDFLARE_URL="https://purchasing-harry-gotten-ladder.trycloudflare.com" bash scripts/sync_tunnel_url_and_gdpr_subscription_py.sh'
  exit 1
fi

GDPR="$URL/api/webhooks/gdpr"

echo "🔧 Sync tunnel URL + GDPR compliance webhook (Python-safe)"
echo "📄 TOML: $TOML"
echo "✅ Using:"
echo "  application_url = $URL"
echo "  GDPR uri        = $GDPR"

test -f "$TOML" || { echo "❌ Missing: $TOML"; exit 1; }
cp "$TOML" "$TOML.bak_$(date +%s)"
echo "🧾 Backup created."

export URL GDPR TOML

python3 - <<'PY'
import os, re
from pathlib import Path

toml_path = Path(os.environ["TOML"])
URL = os.environ["URL"]
GDPR = os.environ["GDPR"]

s = toml_path.read_text(encoding="utf-8")

# update application_url (force quoted)
s = re.sub(r'^(application_url\s*=\s*).*$',
           r'\1"' + URL + r'"',
           s, flags=re.M)

# remove ALL existing webhook subscription blocks (clean slate)
s = re.sub(r'\n\s*\[\[webhooks\.subscriptions\]\][\s\S]*?(?=\n\s*\[\[|\n\s*\[\w|\Z)', '', s)

# append ONE GDPR compliance subscription
s = s.rstrip() + "\n\n" + "\n".join([
  '[[webhooks.subscriptions]]',
  f'uri = "{GDPR}"',
  'format = "json"',
  'compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]',
]) + "\n"

toml_path.write_text(s, encoding="utf-8")
PY

echo
echo "🔍 Confirming TOML (application_url + GDPR block):"
grep -nE '^application_url\s*=|\[\[webhooks\.subscriptions\]\]|\buri\s*=|\bcompliance_topics\s*=|\bformat\s*=' "$TOML" | tail -n 50 || true

echo
echo "🌐 Reachability check (DNS must work; HTTP code can be anything):"
if curl -sS -I "$GDPR" | head -n 5; then
  echo "✅ Tunnel resolves & responds."
else
  echo "❌ DNS/connection failed. Tunnel not reachable."
  exit 1
fi

echo
echo "🎯 Next (copy/paste):"
echo "  shopify app deploy"
