#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB="$ROOT/web"
UI="$ROOT/abando-frontend"

echo "🔍 Repo: $ROOT"
echo "🔍 Web : $WEB"
echo "🔍 UI  : $UI"

kill_port () {
  local p="$1"
  local pids
  pids="$(lsof -ti tcp:"$p" 2>/dev/null || true)"
  if [[ -n "${pids:-}" ]]; then
    echo "🧹 Killing port $p (PIDs: $pids)"
    kill -9 $pids 2>/dev/null || true
  else
    echo "✅ Port $p is free"
  fi
}

kill_port 3000
kill_port 3001

rm -f /tmp/abando_web_3000.log /tmp/abando_ui_3001.log

echo "✅ Starting Express backend on :3000..."
(
  cd "$WEB"
  PORT=3000 NODE_ENV=development npm run dev
) > /tmp/abando_web_3000.log 2>&1 &

echo "✅ Starting Next UI on :3001..."
(
  cd "$UI"
  PORT=3001 npx next dev -p 3001
) > /tmp/abando_ui_3001.log 2>&1 &

echo "⏳ Waiting for ports..."
for i in {1..60}; do
  if (lsof -i tcp:3000 >/dev/null 2>&1) && (lsof -i tcp:3001 >/dev/null 2>&1); then
    break
  fi
  sleep 0.25
done

echo ""
echo "🔎 Identity check (who owns the port):"
echo "---- 3000 HEAD / ----"
curl -sI http://localhost:3000/ | head -n 12 || true
echo "---- 3001 HEAD /demo/playground ----"
curl -sI http://localhost:3001/demo/playground | head -n 12 || true

echo ""
echo "🔎 Proxy check (3000 should serve UI via proxy if your index.js patch is in place):"
echo "---- 3000 HEAD /demo/playground ----"
curl -sI http://localhost:3000/demo/playground | head -n 12 || true
echo "---- 3000 HEAD /embedded ----"
curl -sI http://localhost:3000/embedded | head -n 12 || true

echo ""
echo "✅ Logs:"
echo "  tail -f /tmp/abando_web_3000.log"
echo "  tail -f /tmp/abando_ui_3001.log"
echo ""
echo "✅ Open:"
echo "  UI Direct:   http://localhost:3001/demo/playground"
echo "  UI Embedded: http://localhost:3001/embedded"
echo "  Backend:     http://localhost:3000/"
