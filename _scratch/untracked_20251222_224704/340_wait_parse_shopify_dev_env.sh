#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
TIMEOUT_SEC="${2:-60}"

test -f "$LOG" || { echo "❌ Missing log: $LOG" >&2; exit 1; }

deadline=$(( $(date +%s) + TIMEOUT_SEC ))

clean_log () {
  # Remove ANSI escape sequences + other control chars that break parsing
  perl -pe 's/\e\[[0-9;?]*[A-Za-z]//g; s/[\x00-\x08\x0B\x0C\x0E-\x1F]//g' "$LOG"
}

parse_backend_port () {
  clean_log | perl -ne '
    if (/listening on http:\/\/0\.0\.0\.0:(\d+)/) { $p=$1 }
    END { print $p||"" }
  '
}

parse_tunnel () {
  # Supports:
  # - "Using URL: https://xxx.trycloudflare.com"
  # - "Using URL:\nhttps://xxx.trycloudflare.com"
  clean_log | perl -0777 -ne '
    while(/Using URL:\s*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)\b/gi){ $u=$1 }
    while(/Using URL:\s*\n\s*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)\b/gi){ $u=$1 }
    print $u||"";
  '
}

while :; do
  BACKEND_PORT="$(parse_backend_port || true)"
  TUNNEL="$(parse_tunnel || true)"

  if [[ -n "${BACKEND_PORT:-}" && -n "${TUNNEL:-}" ]]; then
    echo "export BACKEND_PORT='$BACKEND_PORT'"
    echo "export TUNNEL='$TUNNEL'"
    exit 0
  fi

  now=$(date +%s)
  if (( now >= deadline )); then
    echo "ERR: Could not parse both values from $LOG within ${TIMEOUT_SEC}s" >&2
    echo "ERR: BACKEND_PORT='${BACKEND_PORT:-}' TUNNEL='${TUNNEL:-}'" >&2
    echo "---- debug (last 120 cleaned lines) ----" >&2
    clean_log | tail -n 120 >&2
    exit 1
  fi

  sleep 1
done
