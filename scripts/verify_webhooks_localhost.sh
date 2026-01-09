#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8081}"
BASE="http://127.0.0.1:${PORT}"

echo "🔗 Testing base: $BASE"
echo

echo "== HEAD /api/webhooks/gdpr (expect 200) =="
curl -sS -I "$BASE/api/webhooks/gdpr" | head -n 25 || true
echo

echo "== GET /api/webhooks/gdpr (expect ok) =="
curl -sS "$BASE/api/webhooks/gdpr" | head -n 50 || true
echo
echo

echo "== POST /api/webhooks/gdpr (no HMAC) expect 401 =="
curl -sS -i -X POST "$BASE/api/webhooks/gdpr" \
  -H "Content-Type: application/json" \
  --data '{"ping":true}' | head -n 40 || true
echo
echo

echo "== POST /api/webhooks (no HMAC) expect 401 =="
curl -sS -i -X POST "$BASE/api/webhooks" \
  -H "Content-Type: application/json" \
  --data '{"ping":true}' | head -n 40 || true
echo

echo "✅ Done."
