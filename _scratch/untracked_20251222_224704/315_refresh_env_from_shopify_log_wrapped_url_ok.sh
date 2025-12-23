#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "❌ Missing log: $LOG"; exit 1; }

# Normalize CRLF just in case `script` inserted CRs
TXT="$(cat "$LOG" | tr -d '\r')"

# BACKEND_PORT: take the latest "listening on http://0.0.0.0:NNNNN"
BACKEND_PORT="$(
  printf "%s" "$TXT" \
  | rg -oN 'listening on http://0\.0\.0\.0:(\d+)' \
  | tail -n 1 \
  | perl -ne 'print $1 if /:(\d+)/'
)"

# TUNNEL: support BOTH:
# 1) "Using URL: https://xxx.trycloudflare.com"
# 2) "Using URL:\nhttps://xxx.trycloudflare.com"
TUNNEL="$(
  printf "%s" "$TXT" \
  | awk '
      /Using URL:/ { want=1; next }
      want==1 && $0 ~ /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/ {
        last=$0; want=0; next
      }
      # also accept same-line form
      match($0, /Using URL:[[:space:]]*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/, m) {
        last=m[1]
      }
      END { if (last!="") print last }
    '
)"

if [[ -z "${BACKEND_PORT:-}" || -z "${TUNNEL:-}" ]]; then
  echo "ERR: Could not parse env from $LOG" >&2
  echo "ERR: TUNNEL='${TUNNEL:-}' BACKEND_PORT='${BACKEND_PORT:-}'" >&2
  echo
  echo "🔎 Debug: last 60 lines containing URL/listening:"
  printf "%s" "$TXT" | tail -n 300 | rg -n "Using URL:|trycloudflare\.com|listening on http://0\.0\.0\.0:" || true
  exit 1
fi

echo "export TUNNEL='$TUNNEL'"
echo "export BACKEND_PORT='$BACKEND_PORT'"
