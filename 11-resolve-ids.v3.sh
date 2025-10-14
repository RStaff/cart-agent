#!/usr/bin/env bash
set -Eeuo pipefail

# ===== helpers =====
say() { printf "%b\n" "$*"; }
die() { printf "✖ %s\n" "$*" >&2; exit 1; }
mask() { printf '%s…' "$(printf %s "$1" | cut -c1-6)"; }
have() { command -v "$1" >/dev/null 2>&1; }

JQ=""
if have jq; then JQ=jq; fi

json_get_first() {
  # args: file keypath (jq-style for jq, dotted simple for python)
  local file="$1"; shift
  if [ -n "$JQ" ]; then
    "$JQ" -r "$*" < "$file"
  else
    python3 - "$file" "$*" <<'PY'
import sys, json
f = sys.argv[1]
expr = sys.argv[2]
data = json.load(open(f))
# very small parser for a handful of paths we use:
def pick(d, path):
    cur = d
    for part in path.split('.'):
        if part.endswith('[]'):
            key = part[:-2]
            cur = cur.get(key, [])
        else:
            cur = cur.get(part, None) if isinstance(cur, dict) else None
        if cur is None: return None
    return cur
v = pick(data, expr)
if isinstance(v, (str,int)): print(v)
elif v is True: print("true")
elif v is False: print("false")
elif v is None: print("")
else: print("")
PY
  fi
}

choose_line() {
  # prints a numbered menu from stdin; echoes chosen line
  nl -w2 -s'. ' -ba | sed '/^[[:space:]]*$/d'
}

pick_from_list() {
  # args: titles_file ids_file prompt
  local titles="$1" ids="$2" prompt="$3"
  [ -s "$titles" ] || die "nothing to choose from"
  if [ "$(wc -l < "$titles")" -eq 1 ]; then
    head -n1 "$ids"
    return
  fi
  say ""; say "$prompt"
  paste "$titles" "$ids" | awk -F'\t' '{print $1}' | choose_line
  read -r -p "Enter number: " n
  local total; total="$(wc -l < "$titles")"
  [ "$n" -ge 1 ] 2>/dev/null && [ "$n" -le "$total" ] 2>/dev/null || die "invalid selection"
  sed -n "${n}p" "$ids"
}

req() {
  # args: url
  local url="$1"
  local H B
  H="$(mktemp)"; B="$(mktemp)"
  curl -sS -D "$H" -o "$B" -H "Authorization: Bearer ${CF_API_TOKEN}" "$url" || true
  local code; code="$(awk 'tolower($0) ~ /^http\/[0-9.]+/ {c=$2} END{print c+0}' "$H")"
  printf '%s %s %s\n' "$code" "$H" "$B"
}

append_or_replace_rc() {
  local key="$1" val="$2"
  local rc="$HOME/.zshrc"
  touch "$rc"
  # remove existing line(s) for key
  sed -i.bak "/^export ${key}=.*/d" "$rc" || true
  printf 'export %s="%s"\n' "$key" "$val" >> "$rc"
}

# ===== preflight =====
: "${CF_API_TOKEN:?Set CF_API_TOKEN (e.g. export CF_API_TOKEN=...)}"
AB_DOMAIN="${AB_DOMAIN:-}"

say "Using:"
say "  CF_API_TOKEN = $(mask "$CF_API_TOKEN")"
[ -n "$AB_DOMAIN" ] && say "  AB_DOMAIN    = $AB_DOMAIN" || say "  AB_DOMAIN    = (not set; you can type one when prompted)"

# ===== 1) verify token =====
say ""; say "Verifying token…"
read -r CODE HDR BODY < <(req "https://api.cloudflare.com/client/v4/user/tokens/verify")
[ "$CODE" -eq 200 ] || {
  say "HTTP $CODE from tokens/verify — headers:"; sed -n '1,40p' "$HDR"
  say "--- body ---"; sed -n '1,100p' "$BODY"; die "token verification failed"
}
if [ -n "$JQ" ]; then
  status=$("$JQ" -r '.result.status' < "$BODY")
  scopes=$("$JQ" -r '[.result.policies[].permission_group.id] | join(", ")' < "$BODY" 2>/dev/null || echo "")
else
  status="$(json_get_first "$BODY" 'result.status')"
  scopes=""
fi
say "  status: ${status:-unknown}"
[ "$status" = "active" ] || die "token is not active"

# ===== 2) fetch accounts and choose one =====
say ""; say "Fetching accounts…"
read -r CODE HDR BODY < <(req "https://api.cloudflare.com/client/v4/accounts")
[ "$CODE" -eq 200 ] || { say "HTTP $CODE from /accounts"; sed -n '1,60p' "$HDR"; die "cannot list accounts (token needs Account:Read)"; }

titles="$(mktemp)"; ids="$(mktemp)"
if [ -n "$JQ" ]; then
  "$JQ" -r '.result[] | "\(.name)\t\(.id)"' < "$BODY" | tee >(cut -f1 > "$titles") | cut -f2 > "$ids" >/dev/null
else
  python3 - "$BODY" "$titles" "$ids" <<'PY'
import sys,json
d=json.load(open(sys.argv[1]))
t=open(sys.argv[2],'w'); i=open(sys.argv[3],'w')
for acc in d.get("result",[]):
    t.write(f"{acc.get('name','(unnamed)')}\n")
    i.write(f"{acc.get('id','')}\n")
PY
fi
[ -s "$ids" ] || die "no accounts returned"
CF_ACCOUNT_ID="$(pick_from_list "$titles" "$ids" "Select Cloudflare Account:")"
say "  CF_ACCOUNT_ID = $CF_ACCOUNT_ID"

# ===== 3) fetch zones (optionally by domain) and choose one =====
ZONE_URL="https://api.cloudflare.com/client/v4/zones"
[ -n "$AB_DOMAIN" ] && ZONE_URL="${ZONE_URL}?name=${AB_DOMAIN}"
say ""; say "Fetching zones…"
read -r CODE HDR BODY < <(req "$ZONE_URL")
[ "$CODE" -eq 200 ] || { say "HTTP $CODE from /zones"; sed -n '1,60p' "$HDR"; die "cannot list zones (token needs Zone:Read)"; }

ztitles="$(mktemp)"; zids="$(mktemp)"
if [ -n "$JQ" ]; then
  "$JQ" -r '.result[] | "\(.name)\t\(.id)"' < "$BODY" | tee >(cut -f1 > "$ztitles") | cut -f2 > "$zids" >/dev/null
else
  python3 - "$BODY" "$ztitles" "$zids" <<'PY'
import sys,json
d=json.load(open(sys.argv[1]))
t=open(sys.argv[2],'w'); i=open(sys.argv[3],'w')
for z in d.get("result",[]):
    t.write(f"{z.get('name','(unnamed)')}\n")
    i.write(f"{z.get('id','')}\n")
PY
fi
[ -s "$zids" ] || die "no zones matched (check AB_DOMAIN or permissions)"
CF_ZONE_ID="$(pick_from_list "$ztitles" "$zids" "Select Zone:")"
AB_DOMAIN="$(sed -n "$(grep -n "$(printf %q "$CF_ZONE_ID")" "$zids" | cut -d: -f1)p" "$ztitles")" || true
say "  CF_ZONE_ID    = $CF_ZONE_ID"
[ -n "$AB_DOMAIN" ] && say "  DOMAIN        = $AB_DOMAIN"

# ===== 4) export now + persist idempotently =====
export CF_ACCOUNT_ID CF_ZONE_ID AB_DOMAIN
append_or_replace_rc CF_ACCOUNT_ID "$CF_ACCOUNT_ID"
append_or_replace_rc CF_ZONE_ID "$CF_ZONE_ID"
append_or_replace_rc AB_DOMAIN "$AB_DOMAIN"
say ""; say "✓ Exported to current shell and updated ~/.zshrc"
say "   Reload later with: source ~/.zshrc"
