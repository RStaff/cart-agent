#!/usr/bin/env bash
set -euo pipefail

TOML="shopify.app.toml"
test -f "$TOML" || { echo "❌ Missing $TOML"; exit 1; }

echo "🧹 Killing any old shopify/cloudflared processes (best effort)..."
pkill -f "shopify app dev" 2>/dev/null || true
pkill -f cloudflared 2>/dev/null || true

echo "🚇 Starting fresh tunnel via: shopify app dev --reset"
echo "   (This will print a new https://xxxxx.trycloudflare.com)"
echo

# Run shopify app dev in background but capture output
LOG="/tmp/abando_shopify_dev_$$.log"
( shopify app dev --reset 2>&1 | tee "$LOG" ) &
DEV_PID=$!

# Wait for the first trycloudflare URL to appear
echo "⏳ Waiting for trycloudflare URL..."
for i in $(seq 1 60); do
  BASE="$(rg -o 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -n 1 || true)"
  if [[ -n "${BASE:-}" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "${BASE:-}" ]]; then
  echo "❌ Did not detect trycloudflare URL in 60s."
  echo "   Check the running output above. If you see a URL, copy it manually and re-run patch script."
  exit 2
fi

GDPR="${BASE%/}/api/webhooks/gdpr"
echo "✅ Detected tunnel base: $BASE"
echo "✅ GDPR endpoint:       $GDPR"
echo

TS="$(date +%s)"
cp "$TOML" "$TOML.bak_$TS"
echo "📦 Backup: $TOML.bak_$TS"

python3 - <<PY
import re, pathlib
p = pathlib.Path("$TOML")
s = p.read_text()
base = "$BASE"
gdpr = "$GDPR"

# application_url
s = re.sub(r'(^\s*application_url\s*=\s*")https://[^"]+(")', r'\\1' + base + r'\\2', s, flags=re.M)

# GDPR uri line(s)
s = re.sub(r'(^\s*uri\s*=\s*")https://[^"]+/api/webhooks/gdpr(")', r'\\1' + gdpr + r'\\2', s, flags=re.M)

# redirect_urls entries using trycloudflare -> rewrite to new base, keep path
def repl(m):
    url = m.group(0)  # includes quotes
    # strip leading "https://old.trycloudflare.com" keep remainder (path + trailing quote)
    path = re.sub(r'^"https://[^"]+\.trycloudflare\.com', '', url[:-1])
    return '"' + base + path + '"'
s = re.sub(r'"https://[^"]+\.trycloudflare\.com[^"]*"', repl, s)

p.write_text(s)
print("✅ Patched shopify.app.toml")
PY

echo
echo "🔎 Key lines now:"
rg -n 'application_url\s*=|redirect_urls|/api/webhooks/gdpr' "$TOML" || true

echo
echo "🌐 Verifying HEAD + GET:"
curl -sS -I "$GDPR" | head -n 20 || true
echo
curl -sS "$GDPR" | head -n 50 || true

echo
echo "🔐 Verifying POST without HMAC expects 401:"
curl -sS -i -X POST "$GDPR" -H "Content-Type: application/json" --data '{"ping":true}' | head -n 40 || true

echo
echo "✅ Tunnel is still running in this terminal (PID=$DEV_PID)."
echo "   Leave it running while you do Shopify automated checks."
