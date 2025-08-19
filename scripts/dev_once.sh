#!/usr/bin/env bash
set -euo pipefail
/opt/homebrew/bin/shopify app dev --reset --store=cart-agent-dev.myshopify.com > dev.log 2>&1 &
pid=$!
sleep 3
secs=0
while ! grep -q 'Proxy server started on port' dev.log; do
  sleep 1; secs=$((secs+1)); [ $secs -gt 60 ] && { echo "timeout"; exit 1; }
done
while ! grep -q '\[local] webhook receiver listening at http://localhost:' dev.log; do
  sleep 1; secs=$((secs+1)); [ $secs -gt 60 ] && { echo "timeout"; exit 1; }
done
PROXY_PORT=$(sed -n 's/.*Proxy server started on port \([0-9]\+\).*/\1/p' dev.log | tail -n1)
LOCAL_PORT=$(sed -n 's/.*localhost:\([0-9]\+\).*/\1/p' dev.log | tail -n1)
echo "Proxy:$PROXY_PORT Local:$LOCAL_PORT"
