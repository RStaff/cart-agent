#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

SHOP="${1:-example.myshopify.com}"

kill_port () {
  local p="$1"
  lsof -ti tcp:"$p" | xargs -r kill -9 || true
}

echo "🧹 Killing ports 3000 + 3001..."
kill_port 3000
kill_port 3001

echo "🚀 Starting Express (:3000)..."
nohup npm run start > .dev_express.log 2>&1 &
EXP_PID=$!

echo "🚀 Starting Next UI (:3001)..."
# Try common Next dev invocations
if npm --prefix abando-frontend run -s | grep -qE '^  dev'; then
  nohup npm --prefix abando-frontend run dev -- --port 3001 > .dev_next.log 2>&1 &
else
  echo "❌ abando-frontend has no dev script. Check its package.json."
  kill "$EXP_PID" || true
  exit 1
fi
NEXT_PID=$!

cleanup () {
  echo ""
  echo "🧼 Cleanup..."
  kill "$EXP_PID" "$NEXT_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "⏳ Waiting for healthz..."
for i in $(seq 1 40); do
  if curl -sI http://localhost:3000/healthz >/dev/null 2>&1; then
    echo "✅ Express is up"
    break
  fi
  sleep 0.25
done

echo "⏳ Waiting for Next..."
for i in $(seq 1 80); do
  if curl -sI http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ Next is up"
    break
  fi
  sleep 0.25
done

echo ""
echo "🧪 Paid loop (stub) for shop=$SHOP"

echo "1) billing/create"
curl -s "http://localhost:3000/billing/create?shop=$SHOP" \
  -H 'content-type: application/json' \
  -d '{"planKey":"starter"}' | jq .

echo ""
echo "2) confirm-stub"
curl -sI "http://localhost:3000/billing/confirm-stub?shop=$SHOP&plan=starter" | egrep -i 'HTTP/|location' || true

echo ""
echo "3) billing/status"
curl -s "http://localhost:3000/api/billing/status?shop=$SHOP" | jq .

echo ""
echo "✅ OPEN THESE:"
echo "  UI  : http://localhost:3001/embedded?shop=$SHOP"
echo "  API : http://localhost:3000/api/billing/status?shop=$SHOP"
echo "  Prev: http://localhost:3000/api/rescue/preview?shop=$SHOP"
echo ""
echo "Logs:"
echo "  tail -n 80 .dev_express.log"
echo "  tail -n 80 .dev_next.log"
echo ""
echo "Press Ctrl+C when done (will stop both)."
wait
