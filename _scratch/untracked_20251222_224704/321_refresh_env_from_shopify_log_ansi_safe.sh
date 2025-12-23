#!/usr/bin/env bash
set -euo pipefail
LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "ERR: $LOG not found" >&2; exit 1; }

# Strip ANSI + control chars that "script" records, then parse:
TXT="$(perl -pe 's/\e\[[0-9;]*[A-Za-z]//g; s/\r//g; s/[[:cntrl:]]+//g' "$LOG")"

# BACKEND_PORT (last "listening on http://0.0.0.0:NNNNN")
BACKEND_PORT="$(
  printf "%s\n" "$TXT" | perl -ne 'if(/listening on http:\/\/0\.0\.0\.0:(\d+)/){$p=$1} END{print $p||""}'
)"

# TUNNEL supports BOTH:
# - "Using URL: https://xxx.trycloudflare.com"
# - "Using URL:\nhttps://xxx.trycloudflare.com"
TUNNEL="$(
  printf "%s\n" "$TXT" | perl -0777 -ne '
    my $u="";
    while(/Using URL:\s*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)\b/gi){ $u=$1 }
    while(/Using URL:\s*\n\s*(https:\/\/[a-z0-9-]+\.trycloudflare\.com)\b/gi){ $u=$1 }
    print $u;
  '
)"

if [[ -z "${TUNNEL:-}" || -z "${BACKEND_PORT:-}" ]]; then
  echo "ERR: Could not parse env from $LOG" >&2
  echo "TUNNEL='$TUNNEL' BACKEND_PORT='$BACKEND_PORT'" >&2
  echo "---- debug hits ----" >&2
  printf "%s\n" "$TXT" | tail -n 400 | rg -n "Using URL:|trycloudflare\.com|listening on http://0\.0\.0\.0:" >&2 || true
  exit 1
fi

echo "export TUNNEL='$TUNNEL'"
echo "export BACKEND_PORT='$BACKEND_PORT'"
