#!/usr/bin/env bash
set -euo pipefail

echo "== Clean any prior preview =="
shopify app dev clean || true
echo

echo "== Start dev preview (ALLOW URL UPDATES) =="
echo "NOTE: We intentionally do NOT pass --no-update, because privacy compliance webhooks will fail if application_url points to a Shopify/internal domain."
echo

exec env ABANDO_DEV_PROXY=1 shopify app dev --reset
