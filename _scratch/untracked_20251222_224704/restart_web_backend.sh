#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent

# nodemon watches: index.js lib/**/* db.js (per your log)
touch web/index.js
mkdir -p web/lib
touch web/lib/.nodemon_restart

echo "✅ Nudged nodemon via file touch. Watch for: '[nodemon] restarting due to changes...'"
