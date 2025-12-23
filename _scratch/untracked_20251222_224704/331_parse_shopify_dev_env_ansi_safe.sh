#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "ERR: log not found: $LOG" >&2; exit 1; }

TXT="$(cat "$LOG")"

# Strip ANSI escape sequences + carriage returns so regex can see real text
CLEAN="$(
  printf "%s" "$TXT" | perl -pe '
    s/\r//g;
    s/\x1b\[[0-9;?]*[A-Za-z]//g;   # CSI ... cmd
    s/\x1b\][^\a]*(\a|\x1b\\)//g;  # OSC ... BEL or ST
  '
)"

# BACKEND_PORT: last "listening on http://0.0.0.0:PORT"
BACKEND_PORT="$(
  printf "%s" "$CLEAN" \
  | perl -ne 'if(/listening on http:\/\/0\.0\.0\.0:(\d+)/){$p=$1} END{print $p||""}'
)"

# TUNNEL: last "Using URL:" line, supports same-line or newline-wrapped
TUNNEL="$(
  printf "%s" "$CLEAN" \
  | perl -0777 -ne '
      while(/Using URL:\s*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)\b/gi){ $u=$1 }
      while(/Using URL:\s*\n\s*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)\b/gi){ $u=$1 }
      print $u||"";
    '
)"

if [[ -z "${TUNNEL:-}" || -z "${BACKEND_PORT:-}" ]]; then
  echo "ERR: Could not parse env from $LOG" >&2
  echo "ERR: TUNNEL='${TUNNEL:-}' BACKEND_PORT='${BACKEND_PORT:-}'" >&2
  echo "---- debug tail (sanitized) ----" >&2
  printf "%s" "$CLEAN" | tail -n 120 >&2
  exit 1
fi

echo "export TUNNEL='$TUNNEL'"
echo "export BACKEND_PORT='$BACKEND_PORT'"
