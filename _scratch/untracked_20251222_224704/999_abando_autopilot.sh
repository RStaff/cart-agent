#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo "ABANDO AUTOPILOT (dev proof)"
echo "=============================="
echo
echo "Pre-req: Run 'shopify app dev --reset' interactively in Terminal A"
echo "        (do NOT pipe it; let it show app_home URL)."
echo

./scripts/210_sanity_tunnel_backend.sh
echo
./scripts/220_trigger_real_webhook.sh

echo
echo "✅ Autopilot complete: tunnel + backend + REAL webhook delivery proven."
