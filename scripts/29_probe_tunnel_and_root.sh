#!/usr/bin/env bash
set -euo pipefail

URL="https://enjoy-diving-configuration-inform.trycloudflare.com"

echo "== Tunnel URL =="
echo "$URL"
echo

echo "== Probing tunnel root (/) =="
curl -sS -D- "$URL/" -o /dev/null | sed -n '1,25p'
echo

echo "== Probing tunnel /embedded =="
curl -sS -D- "$URL/embedded" -o /dev/null | sed -n '1,25p'
echo

# These are "best effort" probes — they help confirm local services are up.
echo "== Probing local backend root (common Shopify CLI backend ports) =="
for p in 55109 54441 53760 53176 51898 64031 63395; do
  echo "-- http://localhost:$p/ --"
  curl -sS -D- "http://localhost:$p/" -o /dev/null | sed -n '1,12p' || true
done
echo

echo "== Probing local Next (expects 200 on /embedded) =="
curl -sS -D- "http://localhost:3000/embedded" -o /dev/null | sed -n '1,20p' || true
echo
echo "✅ Done. Paste the output here."
