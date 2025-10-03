#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-4000}"
URL="http://localhost:$PORT"
OUT=".prod"
mkdir -p "$OUT"

# Load envs
if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi

# Kill anything on $PORT
if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti :$PORT || true)"
  if [ -n "$PIDS" ]; then
    echo "→ Port :$PORT busy; killing: $PIDS"
    kill -9 $PIDS || true
  fi
fi

# Stop previous app if tracked
if [ -f "$OUT/next.pid" ]; then
  OLD="$(cat "$OUT/next.pid" || true)"
  if [ -n "${OLD:-}" ] && kill -0 "$OLD" 2>/dev/null; then
    echo "→ Stopping previous PID $OLD"
    kill "$OLD" || true
    sleep 0.5
  fi
fi

echo "→ Building (prod)…"
./scripts/envrun.sh npx next build

echo "→ Starting Next (prod) on :$PORT"
(./scripts/envrun.sh npx next start -p "$PORT" >"$OUT/next.log" 2>&1 & echo $! > "$OUT/next.pid")
PID="$(cat "$OUT/next.pid")"
echo "   PID: $PID  Log: $OUT/next.log"

# Wait for healthy
echo -n "→ Waiting for $URL "
for i in {1..40}; do
  if curl -fsS "$URL" >/dev/null 2>&1; then echo "✓"; break; fi
  echo -n "."
  sleep 0.25
done

# Smoke endpoints
echo "→ Smoke checks"
FAIL=0
for path in "/" "/trial" "/onboarding" "/demo/playground"; do
  code="$(curl -o /dev/null -s -w "%{http_code}\n" "$URL$path")"
  echo "  $code  $path"
  if [ "$code" -ne 200 ]; then FAIL=1; fi
done

if [ "$FAIL" -ne 0 ]; then
  echo "❌ Smoke checks failed; tail $OUT/next.log"
  exit 1
fi

echo "✅ Up: $URL"
echo "   Stop: scripts/stop-prod.sh"
echo "   Status: scripts/status-prod.sh"
