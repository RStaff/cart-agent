#!/usr/bin/env bash
# One-shot: normalize redirects → start dev in background → wait for ports → smoke test
# Usage:
#   ./scripts/mvp_all_in_one.sh            # proxy mode (default)
#   MODE=local ./scripts/mvp_all_in_one.sh # test local backend
#   DEPLOY=yes ./scripts/mvp_all_in_one.sh # also deploy (uploads config)

set -euo pipefail

MODE="${MODE:-proxy}"   # proxy | local
DEPLOY="${DEPLOY:-no}"  # yes | no
LOG="dev.log"

say(){ printf "%s\n" "$*"; }
hr(){ printf "%0.s-" {1..80}; printf "\n"; }

ensure_redirects(){
  say "==> Normalizing [auth].redirect_urls from application_url…"
  bash scripts/normalize_auth_redirects.sh >/dev/null
}

start_dev(){
  say "==> Starting Shopify dev (background) and waiting for ports…"
  pkill -f "shopify app dev" 2>/dev/null || true
  rm -f "$LOG"
  # Detach cleanly so tee doesn't hold the shell open
  ( shopify app dev </dev/null | tee "$LOG" ) & disown
}

discover_ports(){
  # Small helper to wait until a matching line appears in dev.log
  wait_for_line(){
    local pattern="$1" ; local timeout="${2:-120}" ; local line
    local t=0
    while [ "$t" -lt "$timeout" ]; do
      line="$(grep -E "$pattern" "$LOG" | tail -n1 || true)"
      if [ -n "$line" ]; then
        printf "%s\n" "$line"
        return 0
      fi
      sleep 1
      t=$((t+1))
    done
    return 1
  }

  # Wait for dev.log to exist and fill
  local t=0
  while [ ! -s "$LOG" ] && [ "$t" -lt 10 ]; do sleep 1; t=$((t+1)); done

  local PLINE LLINE
  PLINE="$(wait_for_line 'Proxy server started on port [0-9]+' 120)" \
    || { echo "❌ Could not find proxy port"; tail -n 100 "$LOG"; exit 1; }
  LLINE="$(wait_for_line '\[local\] webhook receiver listening at http://localhost:[0-9]+' 120)" \
    || { echo "❌ Could not find local port"; tail -n 100 "$LOG"; exit 1; }

  PROXY_PORT="$(printf "%s\n" "$PLINE" | sed -n 's/.*port \([0-9][0-9]*\).*/\1/p')"
  LOCAL_PORT="$(printf "%s\n" "$LLINE" | sed -n 's/.*localhost:\([0-9][0-9]*\).*/\1/p')"

  export PROXY_PORT LOCAL_PORT
  echo "   • Proxy port: $PROXY_PORT"
  echo "   • Local port: $LOCAL_PORT"
}

smoke_test(){
  hr
  local url
  if [ "$MODE" = "local" ]; then
    url="http://localhost:$LOCAL_PORT/api/abandoned-cart"
  else
    url="http://localhost:$PROXY_PORT/api/abandoned-cart"
  fi

  say "==> Smoke test → $url"
  set +e
  resp="$(curl -s -i -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "{\"checkoutId\":\"SMOKE-$RANDOM\",\"email\":\"smoke@example.com\",\"lineItems\":[{\"id\":1,\"title\":\"Test Item\",\"quantity\":1}],\"totalPrice\":9.99}")"
  code="$(printf "%s" "$resp" | sed -n '1s/HTTP\/[^ ]\+ \([0-9]\+\).*/\1/p')"
  set -e

  printf "%s\n" "$resp" | sed -n '1,12p'  # brief head
  if [ "$code" = "201" ]; then
    say "==> ✅ 201 Created."
  else
    say "==> ⚠️  Non-201 status ($code). Check your dev terminal and dev.log."
  fi

  say "==> Looking for latest Ethereal preview URL…"
  preview="$(grep -o 'https://ethereal\.email/message[^ ]*' "$LOG" | tail -n1 || true)"
  if [ -n "$preview" ]; then
    echo "   📬 Email preview: $preview"
  else
    echo "   ℹ️ No preview URL found (using Resend/SendGrid or compose failed)."
  fi

  if command -v sqlite3 >/dev/null; then
    echo "==> Latest DB row:"
    sqlite3 dev.db "SELECT id, checkoutId, email, totalPrice, datetime(createdAt/1000,'unixepoch') FROM AbandonedCart ORDER BY id DESC LIMIT 1;" || true
  fi

  # Metrics straight from local backend (works even in proxy mode)
  if command -v jq >/dev/null; then
    echo "==> Metrics:"
    curl -s "http://localhost:$LOCAL_PORT/api/metrics" | jq . || true
  fi
  hr
}

maybe_deploy(){
  if [ "$DEPLOY" = "yes" ]; then
    say "==> Deploying (uploads config)…"
    shopify app deploy
  fi
}

# ---- run ----
ensure_redirects
start_dev
discover_ports
smoke_test
maybe_deploy

say "==> Done."
say "   • Re-run:   ./scripts/mvp_all_in_one.sh"
say "   • Local:    MODE=local ./scripts/mvp_all_in_one.sh"
say "   • Deploy:   DEPLOY=yes ./scripts/mvp_all_in_one.sh"
