#!/bin/bash

echo "=== DISCOVERY SYNC RUN ==="
date

cd /Users/rossstafford/projects/cart-agent || exit 1

/Users/rossstafford/.volta/bin/node staffordos/system_inventory/runners/discovery_sync_runner_v1.mjs

echo "=== DONE ==="
