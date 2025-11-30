#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo " Abando – Embed Smoke Check   "
echo "=============================="
echo

FRONTEND_URL="${ABANDO_FRONTEND_URL:-https://app.abando.ai}"
EMBED_URL="${FRONTEND_URL%/}/embedded"

echo "→ Checking embed route at:"
echo "   ${EMBED_URL}"
echo

# Simple HTTP status check
HTTP_STATUS="$(curl -o /tmp/abando_embed_smoke.html -w "%{http_code}" -s "${EMBED_URL}" || echo "000")"

echo "HTTP status: ${HTTP_STATUS}"
echo

if [ "${HTTP_STATUS}" != "200" ]; then
  echo "❌ Embed route is not returning 200 OK (got ${HTTP_STATUS})"
  echo "   Check logs on Render and verify your Next.js routing."
  exit 1
fi

echo "✅ Embed route returned 200 OK."

SNIPPET="$(head -c 400 /tmp/abando_embed_smoke.html || true)"

echo
echo "=== Response snippet (first 400 bytes) ==="
echo "${SNIPPET}"
echo
echo "========================================="
echo " 🏁 Embed smoke check complete           "
echo "========================================="
