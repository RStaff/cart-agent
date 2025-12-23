#!/usr/bin/env bash
set -euo pipefail

TUNNEL="${TUNNEL:-}"
test -n "$TUNNEL" || { echo "❌ Set TUNNEL first, e.g. export TUNNEL=https://....trycloudflare.com"; exit 1; }

echo "TUNNEL=$TUNNEL"
echo

paths=(
  "/"
  "/embedded"
  "/demo/playground"
  "/api/webhooks"
  "/webhooks"
  "/api"
  "/health"
  "/api/health"
)

for p in "${paths[@]}"; do
  echo "=== GET $p ==="
  # show status line + first 5 body lines (if any)
  curl -sS -i "$TUNNEL$p" \
    | awk 'NR==1{print} NR==2{print} NR==3{print} NR==4{print} NR==5{print} NR==6{print} NR==7{print} NR==8{print} NR==9{print} NR==10{print}'
  echo
done

echo "✅ Done."
