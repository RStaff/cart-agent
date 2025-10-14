#!/usr/bin/env bash
set -Eeuo pipefail

# --- Read env from your shell ---
: "${CF_API_TOKEN:?CF_API_TOKEN is empty. export it first}"
: "${AB_DOMAIN:=abando.ai}"

mask() { [ -z "${1-}" ] && echo "(empty)" || printf '%s…' "$(printf %s "$1" | cut -c1-6)"; }

hit () {
  local label="$1" url="$2"
  echo
  echo "→ $label"
  local hdr body
  hdr="$(mktemp)"; body="$(mktemp)"
  # -S shows curl errors, -s keeps output quiet, -D write headers, -o write body
  if ! curl -sS -D "$hdr" -o "$body" -H "Authorization: Bearer ${CF_API_TOKEN}" "$url" >/dev/null; then
    echo "  curl error (transport)."
    return
  fi
  local status ct
  status="$(head -n1 "$hdr" | awk '{print $2}')"
  ct="$(grep -i '^content-type:' "$hdr" | head -n1 | awk -F': *' '{print $2}')"
  echo "  status: $status"
  echo "  content-type: ${ct:-unknown}"
  if grep -qi 'application/json' "$hdr"; then
    # pretty print first 60 lines of JSON
    python3 - <<'PY' "$body" || true
import json,sys,io
try:
  data=json.load(open(sys.argv[1]))
  import pprint;pprint.pprint(data, width=100)
except Exception as e:
  print("  (JSON parse error)", e)
PY
  else
    echo "  body preview (first 400 chars):"
    head -c 400 "$body" | sed 's/[^[:print:]\t]/?/g'
    echo
  fi
}

echo "Token:  $(mask "$CF_API_TOKEN")"
echo "Domain: ${AB_DOMAIN}"

hit "verify token" "https://api.cloudflare.com/client/v4/user/tokens/verify"
hit "list accounts" "https://api.cloudflare.com/client/v4/accounts"
hit "find zone by name" "https://api.cloudflare.com/client/v4/zones?name=${AB_DOMAIN}"
hit "list zones (page 1)" "https://api.cloudflare.com/client/v4/zones?per_page=50"
