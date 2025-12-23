#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "ERR: log not found: $LOG" >&2; exit 1; }

# Strip ANSI if present (best-effort)
strip_ansi() { sed -E 's/\x1B\[[0-9;]*[A-Za-z]//g'; }

TXT="$(cat "$LOG" | strip_ansi)"

# Tunnel URL can appear on its own line right after "app_home └ Using URL:"
TUNNEL="$(printf "%s" "$TXT" | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"

# Backend port from: [start] listening on http://0.0.0.0:PORT
BACKEND_PORT="$(
  printf "%s" "$TXT" \
  | grep -Eo 'listening on http://0\.0\.0\.0:[0-9]+' \
  | tail -n 1 \
  | sed -E 's/.*:([0-9]+)/\1/' \
  || true
)"

if [[ -z "${TUNNEL}" || -z "${BACKEND_PORT}" ]]; then
  echo "ERR: Could not parse env from $LOG" >&2
  echo "ERR: TUNNEL='$TUNNEL' BACKEND_PORT='$BACKEND_PORT'" >&2
  exit 2
fi

# IMPORTANT: only output shell-safe exports (so eval is safe)
printf 'export TUNNEL=%q\n' "$TUNNEL"
printf 'export BACKEND_PORT=%q\n' "$BACKEND_PORT"
