#!/usr/bin/env bash
set -euo pipefail

PLANS=("starter" "growth" "scale")

echo "🚀 Smoke-testing billing stub for plans: ${PLANS[*]}"

./scripts/kill_web_port_3000.sh || true

echo "🟦 Starting dev server..."
cd web
npm run dev > /tmp/web_billing_smoke.log 2>&1 &
SERVER_PID=$!
cd ..

sleep 5

for PLAN in "${PLANS[@]}"; do
  echo
  echo "🧪 POST /billing/create planKey=$PLAN"
  curl -s -X POST http://localhost:3000/billing/create \
    -H "Content-Type: application/json" \
    -d "{\"planKey\":\"$PLAN\"}" | jq .
done

echo
echo "🧹 Stopping dev server..."
kill $SERVER_PID 2>/dev/null || true
echo "✅ Smoke test complete."
