#!/usr/bin/env bash
set -euo pipefail

# Idempotent local Abando dev launcher.
# Repo truth:
# - frontend: localhost:3000
# - cart-agent backend: localhost:8081
# - stable public URL should be https://dev.abando.ai via named Cloudflare tunnel

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p logs .tmp
LOG_FILE="logs/dev_up.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "== Abando dev_up =="
echo "root: $ROOT"
echo "started_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "${HOME}/.nvm/nvm.sh"
  nvm use >/dev/null
fi

if [[ -f ".tmp/named-tunnel.env" ]]; then
  # shellcheck disable=SC1090
  source ".tmp/named-tunnel.env"
fi

export ABANDO_DEV_PUBLIC_URL="${ABANDO_DEV_PUBLIC_URL:-https://dev.abando.ai}"
export ABANDO_CLOUDFLARE_TUNNEL_NAME="${ABANDO_CLOUDFLARE_TUNNEL_NAME:-abando-dev}"
STATE_FILE=".tmp/dev-session.json"

validate_session_state() {
  python3 - "$STATE_FILE" <<'PY'
import json
import sys
from pathlib import Path

state_path = Path(sys.argv[1])
if not state_path.exists():
    print("[dev_up][error] missing session artifact .tmp/dev-session.json", file=sys.stderr)
    raise SystemExit(1)

data = json.loads(state_path.read_text())
errors = []

if not data.get("ok"):
    errors.append("session_not_ok")
if data.get("tunnelMode") != "named":
    errors.append("tunnel_mode_not_named")
if data.get("activeTunnelUrl") != "https://dev.abando.ai":
    errors.append("active_tunnel_url_not_canonical")
if data.get("activeTunnelHost") != "dev.abando.ai":
    errors.append("active_tunnel_host_not_canonical")
if data.get("tunnelLooksStale") is not False:
    errors.append("tunnel_marked_stale")
if data.get("missingPrerequisites"):
    errors.append("missing_prerequisites_present")

if errors:
    print("[dev_up][error] session artifact failed validation:", ",".join(errors), file=sys.stderr)
    print(json.dumps(data, indent=2), file=sys.stderr)
    raise SystemExit(1)
PY
}

echo "node: $(node -v)"
echo "shopify: $(shopify version | head -n 1 || true)"
echo "cloudflared: $(cloudflared --version | head -n 1 || true)"
echo "stable_url: ${ABANDO_DEV_PUBLIC_URL}"

echo
echo "== clean previous dev processes =="
bash ./scripts/dev_down.sh || true

echo
echo "== start supervised local services =="
bash ./scripts/dev_supervisor.sh start

echo
echo "== require named tunnel health =="
if ! bash ./scripts/dev/start_cloudflare_named_tunnel.sh; then
  echo
  echo "[dev_up][error] stable named tunnel is not healthy."
  echo "[dev_up][error] local services may be up, but public dev is not ready."
  exit 1
fi

validate_session_state

echo
echo "== current status =="
bash ./scripts/dev_status.sh
