#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "❌ Missing log: $LOG"; exit 1; }

# We want:
# - BACKEND_PORT from "[start] listening on http://0.0.0.0:52913"
# - TUNNEL from "└ Using URL: https://....trycloudflare.com"
#
# We take the LAST occurrence of each so restarts work.

BACKEND_PORT="$(
  rg -oN '\[start\] listening on http://0\.0\.0\.0:(\d+)' "$LOG" \
  | tail -n 1 \
  | perl -ne 'print $1 if /\:(\d+)/'
)"

TUNNEL="$(
  rg -oN 'Using URL:\s+(https://[a-z0-9-]+\.trycloudflare\.com)' "$LOG" \
  | tail -n 1 \
  | perl -ne 'print $1 if /(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/'
)"

if [[ -z "${BACKEND_PORT:-}" || -z "${TUNNEL:-}" ]]; then
  echo "ERR: Could not parse env from $LOG" >&2
  echo "ERR: TUNNEL='${TUNNEL:-}' BACKEND_PORT='${BACKEND_PORT:-}'" >&2
  exit 1
fi

echo "export TUNNEL='$TUNNEL'"
echo "export BACKEND_PORT='$BACKEND_PORT'"
