#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo "   Abando Stack Boot"
echo "=============================="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p logs

################################
# 1) Kill anything on :3000
################################
echo
echo "1️⃣ Clearing port 3000 (backend/frontend)…"
if [ -x "./scripts/backend_port_kill_3000.sh" ]; then
  ./scripts/backend_port_kill_3000.sh || true
else
  echo "⚠️ scripts/backend_port_kill_3000.sh not found; skipping."
fi

################################
# 2) Start backend dev
################################
echo
echo "2️⃣ Starting backend dev in background…"

if [ ! -x "./scripts/backend_run_local.sh" ]; then
  echo "❌ scripts/backend_run_local.sh not found or not executable."
  exit 1
fi

./scripts/backend_run_local.sh > logs/backend_dev.log 2>&1 &
BACKEND_PID=$!

echo "→ Backend PID: $BACKEND_PID (logs/backend_dev.log)"

# Wait for /health
HEALTH_URL="http://localhost:3000/health"
echo "→ Waiting for backend health at $HEALTH_URL …"

for i in {1..30}; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✅ Backend is up (health OK)."
    break
  fi
  echo "   … not ready yet ($i/30), sleeping 2s"
  sleep 2
done

if ! curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
  echo "❌ Backend did not become healthy in time."
  echo "   Check logs/backend_dev.log"
  exit 1
fi

################################
# 3) Start frontend dev
################################
echo
echo "3️⃣ Starting frontend dev in background…"

if [ ! -x "./scripts/frontend_run_local.sh" ]; then
  echo "❌ scripts/frontend_run_local.sh not found or not executable."
  exit 1
fi

./scripts/frontend_run_local.sh > logs/frontend_dev.log 2>&1 &
FRONTEND_PID=$!

echo "→ Frontend PID: $FRONTEND_PID (logs/frontend_dev.log)"

FRONT_DEV_URL="http://localhost:3001/command-center"
echo "→ Waiting for frontend at $FRONT_DEV_URL …"

for i in {1..30}; do
  HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" "$FRONT_DEV_URL" || echo "000")"
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend dev responding (200)."
    break
  fi
  echo "   … not ready yet (HTTP $HTTP_CODE, $i/30), sleeping 2s"
  sleep 2
done

################################
# 4) Final stack status
################################
echo
echo "4️⃣ Running full stack status…"
if [ -x "./scripts/abando_stack_status.sh" ]; then
  ./scripts/abando_stack_status.sh || true
else
  echo "⚠️ scripts/abando_stack_status.sh not found; skipping."
fi

echo
echo "=============================="
echo "   Abando Stack Boot Complete"
echo "=============================="
echo "Backend PID : $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo
echo "To stop the dev stack later, you can run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "or:"
echo "  scripts/backend_port_kill_3000.sh"
echo "  lsof -ti tcp:3001 | xargs kill -9  (if needed)"
