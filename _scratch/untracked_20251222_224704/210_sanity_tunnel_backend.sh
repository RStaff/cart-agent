#!/usr/bin/env bash
set -euo pipefail

LOG="${SHOPIFY_LOG:-.shopify_dev.log}"

if [[ ! -f "$LOG" ]]; then
  echo "ERROR: $LOG not found. In Terminal A run: script -q .shopify_dev.log ; shopify app dev --reset"
  exit 1
fi

# Extract latest trycloudflare URL shown by app_home
TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true)"

# Extract latest backend port from: [start] listening on http://0.0.0.0:PORT
BACKEND_PORT="$(
  grep -Eo 'listening on http://0\.0\.0\.0:[0-9]+' "$LOG" \
  | tail -n 1 \
  | sed -E 's/.*:([0-9]+)/\1/' \
  || true
)"

if [[ -z "${TUNNEL}" || -z "${BACKEND_PORT}" ]]; then
  echo "ERROR: Could not parse TUNNEL and/or BACKEND_PORT from $LOG yet."
  echo "TUNNEL='$TUNNEL'"
  echo "BACKEND_PORT='$BACKEND_PORT'"
  echo "Tip: wait until Terminal A shows both 'app_home └ Using URL:' and '[start] listening on ...' then rerun."
  exit 1
fi

export TUNNEL BACKEND_PORT

echo "TUNNEL=$TUNNEL"
echo "BACKEND_PORT=$BACKEND_PORT"
