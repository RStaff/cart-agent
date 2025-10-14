#!/usr/bin/env bash
set -Eeuo pipefail
: "${CF_API_TOKEN:?Set CF_API_TOKEN (export CF_API_TOKEN=...)}"

mask(){ printf '%s…' "$(printf %s "$1" | cut -c1-6)"; }
show(){
  local title="$1" url="$2"
  echo; echo "→ $title"
  hdr="$(mktemp)"; body="$(mktemp)"
  curl -sS -D "$hdr" -o "$body" -H "Authorization: Bearer ${CF_API_TOKEN}" "$url" >/dev/null || true
  code="$(awk 'NR==1{print $2}' "$hdr")"
  ctype="$(awk -F': ' 'tolower($1)=="content-type"{print $2}' "$hdr" | tr -d '\r' | head -n1)"
  echo "  status: $code"
  echo "  content-type: ${ctype:-unknown}"
  if printf %s "$ctype" | grep -qi 'application/json'; then
    python3 - <<'PY' "$body" || true
import sys, json
try:
  d=json.load(open(sys.argv[1]))
  import pprint; pprint.pprint(d)
except Exception as e:
  print("  (JSON parse error)", e)
PY
  else
    echo "  body (first 400 chars):"
    head -c 400 "$body" | sed 's/[^[:print:]\t]/?/g'
    echo
  fi
}

echo "CF_API_TOKEN: $(mask "$CF_API_TOKEN")"
show "token verify" "https://api.cloudflare.com/client/v4/user/tokens/verify"
show "accounts list" "https://api.cloudflare.com/client/v4/accounts"
show "zones list (first page)" "https://api.cloudflare.com/client/v4/zones?per_page=50"
