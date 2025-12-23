#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "❌ Missing log: $LOG"; exit 1; }

# Remove CRs that `script` sometimes inserts
TXT="$(cat "$LOG" | tr -d '\r')"

BACKEND_PORT="$(
  printf "%s" "$TXT" \
  | perl -ne 'while(/listening on http:\/\/0\.0\.0\.0:(\d+)/g){$p=$1} END{print $p||""}'
)"

# Support BOTH:
# - "Using URL: https://xxx.trycloudflare.com"
# - "Using URL:\nhttps://xxx.trycloudflare.com"
TUNNEL="$(
  printf "%s" "$TXT" \
  | perl -0777 -ne '
      while(/Using URL:\s*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)\b/gi){ $u=$1 }
      while(/Using URL:\s*\n\s*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)\b/gi){ $u=$1 }
      print $u||"";
    '
)"

if [[ -z "${TUNNEL:-}" || -z "${BACKEND_PORT:-}" ]]; then
  echo "ERR: Could not parse env from $LOG" >&2
  echo "ERR: TUNNEL='${TUNNEL:-}' BACKEND_PORT='${BACKEND_PORT:-}'" >&2
  echo
  echo "🔎 Debug hits (last 200 lines with URL/port):"
  printf "%s" "$TXT" | tail -n 200 | rg -n "Using URL:|trycloudflare\.com|listening on http://0\.0\.0\.0:" || true
  exit 1
fi

echo "export TUNNEL='$TUNNEL'"
echo "export BACKEND_PORT='$BACKEND_PORT'"
