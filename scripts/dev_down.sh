#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p logs .tmp
LOG_FILE="logs/dev_down.log"
STATE_FILE=".tmp/dev-session.json"
SUPERVISOR_STATE_FILE=".tmp/dev-supervisor.json"
SUPERVISOR_PID_FILE=".tmp/dev-supervisor.pid"
WATCHDOG_PID_FILE=".tmp/dev-watchdog.pid"
TUNNEL_PID_FILE=".tmp/dev-tunnel.pid"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "== Abando dev_down =="
echo "started_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

bash ./scripts/dev_supervisor.sh stop || true
bash ./scripts/abando-dev-down.sh || true
pkill -f "shopify app dev" || true
pkill -f "cloudflared tunnel.*abando-dev" || true
rm -f "$SUPERVISOR_STATE_FILE" "$SUPERVISOR_PID_FILE" "$WATCHDOG_PID_FILE" "$TUNNEL_PID_FILE"

cat > "$STATE_FILE" <<JSON
{
  "ok": false,
  "activeTunnelUrl": "https://dev.abando.ai",
  "activeTunnelHost": "dev.abando.ai",
  "localServerUrl": "http://127.0.0.1:8081",
  "dashboardUrl": "https://dev.abando.ai/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host",
  "summaryUrl": "https://dev.abando.ai/api/dashboard/summary?shop=cart-agent-dev.myshopify.com",
  "previewUrl": null,
  "detectedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tunnelLooksStale": true,
  "tunnelMode": "named",
  "missingPrerequisites": ["workflow_stopped"]
}
JSON

echo
echo "== remaining listeners =="
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:8081 -sTCP:LISTEN || true
lsof -nP -iTCP:4000 -sTCP:LISTEN || true

echo "done"
