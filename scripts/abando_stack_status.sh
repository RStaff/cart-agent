#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo "   Abando Stack Status"
echo "=============================="
echo

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "📦 Repo root: $ROOT"
echo

#############################
# 1) Backend health (:3000)
#############################
echo "1️⃣ Backend (/health on :3000)"

cd "$ROOT"

if scripts/backend_health_smoke.sh; then
  echo "✅ Backend health check: PASS"
else
  echo "❌ Backend health check: FAIL"
fi

#############################
# 2) Frontend dev (:3001)
#############################
echo
echo "2️⃣ Frontend dev (Next.js on :3001 → /command-center)"

FRONT_DEV_URL="http://localhost:3001/command-center"
HTTP_CODE_DEV="$(curl -s -o /dev/null -w "%{http_code}" "$FRONT_DEV_URL" || echo "000")"

if [ "$HTTP_CODE_DEV" = "200" ]; then
  echo "✅ Frontend dev responding at $FRONT_DEV_URL (200)"
else
  echo "⚠️ Frontend dev not confirmed (HTTP $HTTP_CODE_DEV) at:"
  echo "   $FRONT_DEV_URL"
  echo "   Make sure 'scripts/frontend_run_local.sh' is running in another terminal."
fi

#############################
# 3) Vercel production
#############################
echo
echo "3️⃣ Vercel production health (/api/health)"

PROD_BASE_URL="https://abando-frontend-ohjrm4i6v-ross-projects-1d9d3b7c.vercel.app"
PROD_HEALTH_URL="$PROD_BASE_URL/api/health"

HTTP_CODE_PROD="$(curl -s -o /tmp/abando_prod_health.json -w "%{http_code}" "$PROD_HEALTH_URL" || echo "000")"

if [ "$HTTP_CODE_PROD" = "200" ]; then
  echo "✅ Vercel production health OK at $PROD_HEALTH_URL (200)"
  echo "Response:"
  cat /tmp/abando_prod_health.json
else
  echo "⚠️ Vercel production health not confirmed (HTTP $HTTP_CODE_PROD) at:"
  echo "   $PROD_HEALTH_URL"
fi

echo
echo "=============================="
echo "   Abando Stack Status Done"
echo "=============================="
