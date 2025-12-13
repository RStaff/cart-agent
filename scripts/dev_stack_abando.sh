#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB="$ROOT/web"
UI="$ROOT/abando-frontend"

cleanup() {
  echo ""
  echo "🛑 Stopping dev stack..."
  jobs -pr | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "🔍 Repo: $ROOT"
echo "🔍 Web : $WEB"
echo "🔍 UI  : $UI"
echo ""

echo "🧹 Killing anything on ports 3000/3001..."
lsof -ti tcp:3000 2>/dev/null | xargs -r kill -9 || true
lsof -ti tcp:3001 2>/dev/null | xargs -r kill -9 || true

echo "✅ Starting Express (Shopify backend) on :3000..."
( cd "$WEB" && npm run dev ) >/tmp/abando_web_3000.log 2>&1 &

echo "✅ Starting Next.js UI on :3001..."
( cd "$UI" && PORT=3001 npm run dev ) >/tmp/abando_ui_3001.log 2>&1 &

echo ""
echo "⏳ Waiting for ports..."
for i in {1..100}; do
  if (lsof -i tcp:3000 >/dev/null 2>&1) && (lsof -i tcp:3001 >/dev/null 2>&1); then
    break
  fi
  sleep 0.25
done

echo ""
echo "🔎 Identity check:"
echo "---- 3000 should be Express ----"
curl -sI http://localhost:3000/ | egrep -i 'HTTP/|x-powered-by|location' || true
echo "---- 3001 should be Next.js ----"
curl -sI http://localhost:3001/demo/playground | egrep -i 'HTTP/|x-powered-by' || true

echo ""
echo "🔎 Route check:"
echo "---- 3000 / (expect 307 -> /demo/playground, Express) ----"
curl -sI http://localhost:3000/ | egrep -i 'HTTP/|x-powered-by|location' || true
echo "---- 3000 /demo/playground (expect 200, Next.js) ----"
curl -sI http://localhost:3000/demo/playground | egrep -i 'HTTP/|x-powered-by|location' || true
echo "---- 3000 /embedded (expect 200, Next.js) ----"
curl -sI http://localhost:3000/embedded | egrep -i 'HTTP/|x-powered-by|location' || true

echo ""
echo "✅ Open:"
echo "  Shopify-origin:"
echo "    http://localhost:3000/embedded"
echo "    http://localhost:3000/demo/playground"
echo ""
echo "📄 Logs:"
echo "  tail -f /tmp/abando_web_3000.log"
echo "  tail -f /tmp/abando_ui_3001.log"
echo ""
echo "🟢 Dev stack running. Ctrl+C to stop."
wait
