#!/usr/bin/env bash
set -euo pipefail

TUNNEL="${TUNNEL:-}"
if [[ -z "$TUNNEL" ]]; then
  echo "❌ TUNNEL is empty. Export it first, e.g.:"
  echo 'export TUNNEL="https://whale-employed-born-manhattan.trycloudflare.com"'
  exit 1
fi

HOST="$(python3 - <<PY
import sys, urllib.parse
t=sys.argv[1]
print(urllib.parse.urlparse(t).hostname or "")
PY
"$TUNNEL")"

if [[ -z "$HOST" ]]; then
  echo "❌ Could not parse HOST from TUNNEL=$TUNNEL"
  exit 1
fi

echo "TUNNEL=$TUNNEL"
echo "HOST=$HOST"
echo

# Resolve IPs (dig preferred, nslookup fallback)
IPS="$(dig @1.1.1.1 +short "$HOST" 2>/dev/null | grep -E '^[0-9]+\.' | head -n 2 | tr '\n' ' ' || true)"
if [[ -z "$IPS" ]]; then
  IPS="$(nslookup "$HOST" 1.1.1.1 2>/dev/null | awk '/^Address: /{print $2}' | grep -E '^[0-9]+\.' | head -n 2 | tr '\n' ' ' || true)"
fi

echo "Edge IPs: $IPS"
if [[ -z "$IPS" ]]; then
  echo "❌ Could not resolve any IPv4 edge IPs for $HOST (even via 1.1.1.1)."
  echo "Try: dig @8.8.8.8 +short $HOST"
  exit 1
fi

echo
echo "== Local direct (should be 401 missing hmac) =="
curl -sS -i "http://localhost:3000/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,18p' || true

for ip in $IPS; do
  echo
  echo "== DNS-FREE via --resolve $HOST:443:$ip =="
  echo "-- HEAD /"
  curl -sS -I --resolve "$HOST:443:$ip" "https://$HOST/" | sed -n '1,12p' || true
  echo
  echo "-- POST /api/webhooks (expect 401 missing hmac, NOT Invalid path)"
  curl -sS -i --resolve "$HOST:443:$ip" "https://$HOST/api/webhooks" \
    -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,25p' || true
done

echo
echo "== Recent [webhooks] lines from Express log =="
tail -n 500 .dev_express.log | grep -n "\[webhooks\]" | tail -n 20 || true

echo
echo "✅ Done."
