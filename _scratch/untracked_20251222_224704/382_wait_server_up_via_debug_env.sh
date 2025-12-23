#!/usr/bin/env bash
set -euo pipefail

# 1) Discover tunnel
eval "$(./scripts/381_find_tunnel_anywhere.sh)"

# 2) Wait for /__abando/debug-env
for i in {1..30}; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$TUNNEL/__abando/debug-env" || true)"
  if [[ "$code" == "200" ]]; then
    echo "✅ Server is back (HTTP 200)."
    curl -sS "$TUNNEL/__abando/debug-env"
    echo
    exit 0
  fi
  sleep 1
done

echo "❌ Server did not come back within ~30s. Check Terminal A for errors." >&2
exit 2
