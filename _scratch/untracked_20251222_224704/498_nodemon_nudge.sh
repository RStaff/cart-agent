#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart
echo "✅ Nudged nodemon. Watch dev terminal for: [nodemon] restarting due to changes..."
