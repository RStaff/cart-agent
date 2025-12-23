#!/usr/bin/env bash
set -euo pipefail

echo "TUNNEL=$TUNNEL"
test -n "${TUNNEL:-}" || { echo "❌ TUNNEL is empty"; exit 1; }

HOST="$(python3 - << 'PY'
import os, urllib.parse
print(urllib.parse.urlparse(os.environ["TUNNEL"]).hostname)
PY
)"

echo "HOST=$HOST"
echo

echo "== A) Local direct (should be 401 missing hmac) =="
curl -i "http://localhost:3000/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,20p' || true
echo

echo "== B) Tunnel HEAD / (shows who is answering) =="
curl -sS -I "$TUNNEL/" | sed -n '1,20p' || true
echo

echo "== C) Tunnel POST /api/webhooks (should match local: 401 missing hmac) =="
curl -i "$TUNNEL/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,30p' || true
echo

echo "== D) Express saw what? (last 40 webhook logs) =="
tail -n 400 .dev_express.log | grep -n "\[webhooks\]" | tail -n 40 || echo "(no [webhooks] lines)"
echo

echo "== E) cloudflared log tail (last 120) =="
tail -n 120 .tunnel_logs/cloudflared.log || true
echo

echo "== F) Running processes (cloudflared + shopify app dev) =="
ps aux | egrep -i 'cloudflared|shopify app dev' | grep -v egrep || true
echo

echo "✅ Done."
