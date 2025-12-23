#!/usr/bin/env bash
set -euo pipefail

# --- Guardrails ---
if [[ -z "${TUNNEL:-}" ]]; then
  echo "❌ TUNNEL is not set."
  echo '   export TUNNEL="https://xxxx.trycloudflare.com"'
  exit 1
fi

# --- Parse host safely (no argv nonsense) ---
HOST="$(python3 - <<'PY'
import os, urllib.parse
t = os.environ.get("TUNNEL","")
u = urllib.parse.urlparse(t)
print(u.hostname or "")
PY
)"

if [[ -z "$HOST" ]]; then
  echo "❌ Could not parse hostname from TUNNEL=$TUNNEL"
  exit 1
fi

echo "TUNNEL=$TUNNEL"
echo "HOST=$HOST"
echo

# --- Resolve Cloudflare edge IPs (IPv4 only) ---
IPS="$(dig @1.1.1.1 +short "$HOST" | grep -E '^[0-9]+\.' | head -n 2 || true)"

if [[ -z "$IPS" ]]; then
  echo "❌ No edge IPs resolved via 1.1.1.1"
  echo "Trying Google DNS…"
  IPS="$(dig @8.8.8.8 +short "$HOST" | grep -E '^[0-9]+\.' | head -n 2 || true)"
fi

if [[ -z "$IPS" ]]; then
  echo "❌ Still no IPs resolved. Tunnel is not reachable."
  exit 1
fi

echo "Edge IPs:"
echo "$IPS"
echo

# --- Baseline: local ---
echo "== Local direct (should be 401 missing hmac) =="
curl -sS -i http://localhost:3000/api/webhooks \
  -X POST -H "Content-Type: application/json" -d '{}' \
  | sed -n '1,20p'
echo

# --- DNS-FREE tests ---
for ip in $IPS; do
  echo "== DNS-FREE via --resolve $HOST:443:$ip =="
  echo "-- HEAD /"
  curl -sS -I \
    --resolve "$HOST:443:$ip" \
    "https://$HOST/" \
    | sed -n '1,12p'

  echo
  echo "-- POST /api/webhooks (should be 401, NOT Invalid path)"
  curl -sS -i \
    --resolve "$HOST:443:$ip" \
    "https://$HOST/api/webhooks" \
    -X POST -H "Content-Type: application/json" -d '{}' \
    | sed -n '1,25p'
  echo
done

echo "== Express webhook logs =="
tail -n 500 .dev_express.log | grep -n "\[webhooks\]" | tail -n 20 || true

echo
echo "✅ Done."
