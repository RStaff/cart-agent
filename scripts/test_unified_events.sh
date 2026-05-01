#!/usr/bin/env bash
set -euo pipefail

########################################
# SAFETY GUARD: enforce correct directory
########################################
ROOT_ALLOWED="$HOME/projects/cart-agent"
CWD="$(pwd)"

if [[ "$CWD" != "$ROOT_ALLOWED" ]]; then
  echo "❌ scripts/test_unified_events.sh must be run from:"
  echo "   $ROOT_ALLOWED"
  echo "   You are currently in:"
  echo "   $CWD"
  echo
  echo "👉 Fix it with:"
  echo "   cd ~/projects/cart-agent"
  echo "   scripts/test_unified_events.sh"
  exit 1
fi

########################################
# CONFIG & ENV CHECKS
########################################
BACKEND_SERVICE="${ABANDO_BACKEND_SERVICE:-}"
if [[ -z "$BACKEND_SERVICE" ]]; then
  echo "❌ ABANDO_BACKEND_SERVICE is not set."
  echo "   Example:"
  echo "     export ABANDO_BACKEND_SERVICE=\"srv-xxxxxxxxxxxxxxxxxxxx\""
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set in your environment."
  echo "   Make sure it's exported before running this script."
  exit 1
fi

echo "✅ Using backend service: $BACKEND_SERVICE"
echo "✅ DATABASE_URL is set"
echo

########################################
# DEPLOY + HEALTH CHECK
########################################
echo "🚀 Triggering backend deploy via Render CLI (non-interactive)…"
render services deploy "$BACKEND_SERVICE" --yes --wait || {
  echo "⚠️ Deploy command failed or timed out; continuing to API checks anyway."
}

echo
echo "⏳ Waiting 20s for deploy to settle…"
sleep 20

echo
echo "📡 Calling /api/log-test on pay.abando.ai…"
curl -s https://pay.abando.ai/api/log-test || echo
echo

########################################
# DB CHECKS
########################################
echo "🔍 Checking events table row count…"
psql "$DATABASE_URL" -c "SELECT count(*) AS events_now FROM events;"

echo
echo "🧾 Recent events:"
psql "$DATABASE_URL" -c "
SELECT
  id,
  store_id,
  event_type,
  created_at
FROM events
ORDER BY created_at DESC
LIMIT 5;
"

echo
echo "✅ scripts/test_unified_events.sh completed."
