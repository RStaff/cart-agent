#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "============================"
echo " Abando – Prod Sanity Check"
echo "============================"
echo

cd "${ROOT_DIR}"

# 1) Backend – custom domain
echo "=== Backend (pay.abando.ai) ==="
if scripts/abando_backend_prod_health_cli.sh; then
  echo "✅ Backend via custom domain OK"
else
  echo "❌ Backend via custom domain FAILED"
fi

echo
# 2) Backend – raw Render
BACKEND_URL_FROM_RENDER="https://cart-agent-api.onrender.com"
echo "=== Backend (Render URL) ==="
if scripts/abando_backend_prod_health_cli.sh "${BACKEND_URL_FROM_RENDER}"; then
  echo "✅ Backend via Render URL OK"
else
  echo "❌ Backend via Render URL FAILED"
fi

echo
# 3) Frontend – public domain
echo "=== Frontend (app.abando.ai) ==="
if scripts/abando_frontend_prod_health_cli.sh; then
  echo "✅ Frontend via public URL OK"
else
  echo "❌ Frontend via public URL FAILED"
fi

echo
echo "🏁 Prod sanity check complete."
