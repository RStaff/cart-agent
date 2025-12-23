#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1
./scripts/411_nuke_shopify_dev.sh
shopify app dev --reset
