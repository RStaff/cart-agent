#!/usr/bin/env bash
set -Eeuo pipefail
echo "== DNS =="
echo -n "CNAME abando.ai -> "; dig +short CNAME abando.ai || true
echo -n "A     abando.ai -> "; dig +short abando.ai || true
echo -n "CNAME www.abando.ai -> "; dig +short CNAME www.abando.ai || true
echo -n "A     www.abando.ai -> "; dig +short www.abando.ai || true

echo; echo "== TLS / headers =="
echo "-- HEAD https://abando.ai"
curl -sSI https://abando.ai | sed -n '1,20p' || true
echo; echo "-- HEAD https://www.abando.ai"
curl -sSI https://www.abando.ai | sed -n '1,20p' || true

echo; echo "== Known health probes (if any) =="
for p in /health /healthz /ping /version; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://abando.ai$p")
  echo "$p -> $code"
done
