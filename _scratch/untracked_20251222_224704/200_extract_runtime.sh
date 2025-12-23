#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "❌ Missing $LOG. Run shopify app dev (interactive) in another terminal first."; exit 1; }

strip_ansi() {
python3 - << 'PY'
import re,sys
s=sys.stdin.read().replace("\r","")
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)
print(s)
PY
}

CLEAN="$(cat "$LOG" | strip_ansi)"

TUNNEL="$(printf "%s" "$CLEAN" | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
BACKEND_PORT="$(printf "%s" "$CLEAN" | grep -Eo 'listening on http://0\.0\.0\.0:[0-9]+' | tail -n 1 | sed -E 's/.*:([0-9]+)/\1/' || true)"
PROXY_PORT="$(printf "%s" "$CLEAN" | grep -Eo 'Proxy server started on port [0-9]+' | tail -n 1 | sed -E 's/.* ([0-9]+)/\1/' || true)"
GRAPHIQL_PORT="$(printf "%s" "$CLEAN" | grep -Eo 'GraphiQLurl|GraphiQL server started on port [0-9]+' | tail -n 1 | grep -Eo '[0-9]+' || true)"

[[ -n "$TUNNEL" ]] || { echo "❌ Could not parse TUNNEL from $LOG"; exit 1; }
[[ -n "$BACKEND_PORT" ]] || { echo "❌ Could not parse BACKEND_PORT from $LOG"; exit 1; }

cat <<ENV
export SHOPIFY_LOG="$LOG"
export TUNNEL="$TUNNEL"
export BACKEND_PORT="$BACKEND_PORT"
export PROXY_PORT="${PROXY_PORT:-}"
export GRAPHIQL_PORT="${GRAPHIQL_PORT:-}"
ENV
