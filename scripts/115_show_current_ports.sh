#!/usr/bin/env bash
set -euo pipefail
LOG="/tmp/abando_shopify_dev.log"
echo "== proxy port =="
rg -o 'Proxy server started on port [0-9]+' "$LOG" | tail -n 1 || true
echo
echo "== backend port =="
rg -o 'listening on :[0-9]+' "$LOG" | tail -n 1 || true
echo
echo "== cloudflare url =="
rg -o 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true
