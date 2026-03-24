#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p logs
LOG_FILE="logs/dev_status.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "== Abando dev_status =="
echo "checked_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo
echo "== processes =="
ps aux | rg "next dev|web/src/index.js|dist/server.js|cloudflared tunnel|shopify app dev" || true

echo
echo "== ports =="
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:8081 -sTCP:LISTEN || true
lsof -nP -iTCP:4000 -sTCP:LISTEN || true

echo
echo "== local health =="
curl -i http://127.0.0.1:3000/api/health 2>/dev/null | sed -n '1,8p' || true
curl -i http://127.0.0.1:8081/healthz 2>/dev/null | sed -n '1,8p' || true
curl -i "http://127.0.0.1:8081/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host" 2>/dev/null | sed -n '1,8p' || true

echo
echo "== dev session =="
cat .tmp/dev-session.json 2>/dev/null || echo "missing .tmp/dev-session.json"

echo
echo "== supervisor state =="
cat .tmp/dev-supervisor.json 2>/dev/null || echo "missing .tmp/dev-supervisor.json"

echo
echo "== watchdog status =="
if [[ -f ".tmp/dev-watchdog.pid" ]]; then
  watchdog_pid="$(tr -d '[:space:]' < .tmp/dev-watchdog.pid || true)"
  echo "watchdogPid: ${watchdog_pid:-missing}"
  if [[ -n "${watchdog_pid:-}" ]] && kill -0 "$watchdog_pid" 2>/dev/null; then
    echo "watchdogRunning: true"
  else
    echo "watchdogRunning: false"
  fi
else
  echo "watchdogPid: missing"
  echo "watchdogRunning: false"
fi

echo
echo "== truth summary =="
python3 - <<'PY'
import json
import pathlib
import re
from pathlib import Path

state_path = Path(".tmp/dev-session.json")
if not state_path.exists():
    print("overall: broken (missing session artifact)")
    raise SystemExit(0)

data = json.loads(state_path.read_text())
missing = data.get("missingPrerequisites") or []
mode = data.get("tunnelMode")
url = data.get("activeTunnelUrl")
stale = data.get("tunnelLooksStale")
ok = data.get("ok")

print(f"tunnelMode: {mode}")
print(f"activeTunnelUrl: {url}")
print(f"tunnelLooksStale: {stale}")
print(f"missingPrerequisites: {missing}")
preview_url = data.get("previewUrl")
if preview_url:
    print(f"preview: {preview_url}")
else:
    print("preview: not detected yet")
stale_host = None
pattern = re.compile(r'([a-z0-9-]+\.trycloudflare\.com)')
for source in [
    pathlib.Path(".tmp/dev-session.json"),
    pathlib.Path(".abando-dev/shopify.app.dev.toml"),
    pathlib.Path("logs/dev_shopify.log"),
]:
    if source.exists():
        match = pattern.search(source.read_text())
        if match:
            stale_host = match.group(1)
            break
print(f"staleQuickTunnelHost: {stale_host}")

if ok and mode == "named" and url == "https://dev.abando.ai" and stale is False and not missing:
    print("overall: healthy")
else:
    print("overall: degraded")
PY

ACTIVE_URL="$(python3 - <<'PY'
import json, pathlib
p = pathlib.Path(".tmp/dev-session.json")
if not p.exists():
    raise SystemExit(0)
data = json.loads(p.read_text())
print(data.get("activeTunnelUrl") or "")
PY
)"

echo
echo "== tunnel health =="
if [[ -n "${ACTIVE_URL}" ]]; then
  curl -I "${ACTIVE_URL}" 2>/dev/null | sed -n '1,10p' || true
  curl -I "${ACTIVE_URL}/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host" 2>/dev/null | sed -n '1,10p' || true
else
  echo "no active tunnel url recorded"
fi

echo
echo "== recent logs =="
for file in \
  logs/dev_up.log \
  logs/dev_down.log \
  logs/dev_status.log \
  logs/dev_tunnel.log \
  logs/dev_shopify.log \
  logs/dev_cart-agent.log \
  .abando-dev/abando-frontend.log \
  .abando-dev/cart-agent.log \
  .abando-dev/staffordos-core.log \
  .abando-dev/cloudflared.log
do
  if [[ -f "$file" ]]; then
    echo "--- $file ---"
    tail -n 10 "$file" || true
  fi
done
