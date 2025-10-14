#!/usr/bin/env bash
set -Eeuo pipefail

# ========== helpers ==========
die(){ echo "✖ $*" >&2; exit 1; }
mask(){ printf '%s…' "$(printf %s "$1" | cut -c1-6)"; }
have(){ command -v "$1" >/dev/null 2>&1; }

need_dep(){
  have "$1" || die "Missing dependency: $1"
}

http_get(){
  # usage: http_get <url> <outfile> <headerfile>
  local url="$1" out="$2" hdr="$3"
  curl -sS -D "$hdr" -o "$out" -H "Authorization: Bearer ${CF_API_TOKEN}" "$url" || return 1
  # return status code via echo
  awk 'tolower($0) ~ /^http\/[0-9.]+/ {code=$2} END{print code+0}' "$hdr"
}

write_rc_block(){
  # Idempotent block write to ~/.zshrc
  local rc="$HOME/.zshrc"
  touch "$rc"
  local START="# >>> cloudflare (auto) >>>"
  local END="# <<< cloudflare (auto) <<<"
  # remove previous block
  awk -v s="$START" -v e="$END" '
    $0==s {skip=1}
    skip && $0==e {skip=0; next}
    !skip {print $0}
  ' "$rc" > "$rc.tmp" || true
  mv "$rc.tmp" "$rc"
  {
    echo "$START"
    echo "export AB_DOMAIN=\"$AB_DOMAIN\""
    echo "export CF_ZONE_ID=\"$CF_ZONE_ID\""
    echo "export CF_ACCOUNT_ID=\"$CF_ACCOUNT_ID\""
    echo "$END"
  } >> "$rc"
}

choose_from_list(){
  # prints chosen index (0-based) to stdout
  local n="$1"
  local choice
  while :; do
    read -r -p "Select [0-$((n-1))]: " choice
    [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 0 ] && [ "$choice" -lt "$n" ] && { echo "$choice"; return 0; }
    echo "Invalid selection."
  done
}

# ========== prereqs ==========
need_dep curl
need_dep python3

# ========== inputs ==========
: "${CF_API_TOKEN:?Set CF_API_TOKEN (export CF_API_TOKEN=...)}"
if [ -z "${AB_DOMAIN:-}" ]; then
  read -r -p "Zone domain (e.g. abando.ai): " AB_DOMAIN
  AB_DOMAIN="$(printf %s "$AB_DOMAIN" | tr -d '\r\n ')"
fi
[ -n "$AB_DOMAIN" ] || die "AB_DOMAIN required."

echo "CF_API_TOKEN: $(mask "$CF_API_TOKEN")"
echo "AB_DOMAIN:    $AB_DOMAIN"
echo

# ========== verify token (non-fatal if Cloudflare changes response shape) ==========
echo "Verifying token…"
VER_HDR="$(mktemp)"; VER_BODY="$(mktemp)"
ver_code=$(http_get "https://api.cloudflare.com/client/v4/user/tokens/verify" "$VER_BODY" "$VER_HDR" || echo 0)
if [ "$ver_code" -ne 200 ]; then
  echo "  (warn) token verify HTTP $ver_code — continuing since some scopes still work."
else
  python3 - <<'PY' "$VER_BODY" || true
import json,sys
try:
    d=json.load(open(sys.argv[1]))
    print("  status:", d.get("result",{}).get("status","(unknown)"))
except Exception as e:
    print("  (warn) verify parse:", e)
PY
fi
echo

# ========== fetch zones by name ==========
echo "Looking up zone by name…"
Z_HDR="$(mktemp)"; Z_BODY="$(mktemp)"
z_code=$(http_get "https://api.cloudflare.com/client/v4/zones?name=${AB_DOMAIN}" "$Z_BODY" "$Z_HDR" || echo 0)
[ "$z_code" -eq 200 ] || { sed -n '1,40p' "$Z_HDR"; die "Zones lookup failed (HTTP $z_code). Check domain & token scopes."; }

# Count results
COUNT="$(python3 - <<'PY' "$Z_BODY" || echo 0
import json,sys
try:
    d=json.load(open(sys.argv[1]))
    print(len(d.get("result",[])))
except Exception:
    print(0)
PY
)"
[ "$COUNT" -gt 0 ] || die "No zones matched '${AB_DOMAIN}'. Is the domain in this Cloudflare account?"

if [ "$COUNT" -gt 1 ]; then
  echo "Multiple zones matched '${AB_DOMAIN}':"
  python3 - <<'PY' "$Z_BODY"
import json,sys
d=json.load(open(sys.argv[1]))
for i,z in enumerate(d.get("result",[])):
    print(f"  [{i}] name={z.get('name')} id={z.get('id')} account={z.get('account',{}).get('name')} ({z.get('account',{}).get('id')})")
PY
  idx="$(choose_from_list "$COUNT")"
else
  idx=0
fi

read -r CF_ZONE_ID CF_ACCOUNT_ID CONFIRMED_DOMAIN <<EOF
$(python3 - <<'PY' "$Z_BODY" "$idx"
import json,sys
d=json.load(open(sys.argv[1]))
i=int(sys.argv[2])
z=d.get("result",[])[i]
print(z.get("id",""), z.get("account",{}).get("id",""), z.get("name",""))
PY
)
EOF

[ -n "$CF_ZONE_ID" ] || die "Could not extract CF_ZONE_ID."
[ -n "$CF_ACCOUNT_ID" ] || die "Could not extract CF_ACCOUNT_ID."

echo
echo "✓ CF_ZONE_ID     = $CF_ZONE_ID"
echo "✓ CF_ACCOUNT_ID  = $CF_ACCOUNT_ID"
echo "✓ Zone (confirm) = ${CONFIRMED_DOMAIN:-$AB_DOMAIN}"
echo

# ========== persist & show exports ==========
write_rc_block
echo "Saved to ~/.zshrc within a managed block."
echo
echo "For this shell session, run:"
echo "  export AB_DOMAIN=\"$AB_DOMAIN\""
echo "  export CF_ZONE_ID=\"$CF_ZONE_ID\""
echo "  export CF_ACCOUNT_ID=\"$CF_ACCOUNT_ID\""
echo
echo "Tip: reload later with:  source ~/.zshrc"
