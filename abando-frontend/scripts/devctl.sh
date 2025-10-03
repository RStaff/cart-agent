#!/usr/bin/env bash
set -euo pipefail

cmd="${1:-}"
case "$cmd" in
  mode)
    mode="${2:-auto}"
    if [[ "$mode" != "auto" && "$mode" != "manual" ]]; then
      echo "Usage: scripts/devctl.sh mode [auto|manual]"; exit 2
    fi
    touch .env.local
    if grep -q '^AUTOSEND_MODE=' .env.local; then
      sed -i.bak "s/^AUTOSEND_MODE=.*/AUTOSEND_MODE=${mode}/" .env.local
    else
      echo "AUTOSEND_MODE=${mode}" >> .env.local
    fi
    echo "✓ AUTOSEND_MODE=${mode}"
    ;;
  restart)
    kill_port() { lsof -ti tcp:$1 | xargs -r kill || true; }
    kill_port 3000; kill_port 3002
    PORT=3000 NODE_ENV=development nohup npm run dev >/tmp/next-dev.log 2>&1 &
    for i in $(seq 1 40); do sleep 0.3; curl -sf http://localhost:3000 >/dev/null 2>&1 && break; done
    echo "✅ dev ready at http://localhost:3000"
    ;;
  status)
    curl -s http://localhost:3000/api/status | jq || true
    ;;
  *)
    echo "Usage:"
    echo "  scripts/devctl.sh mode [auto|manual]   # set autosend mode"
    echo "  scripts/devctl.sh restart              # restart dev server"
    echo "  scripts/devctl.sh status               # show combined status"
    exit 1
    ;;
esac
