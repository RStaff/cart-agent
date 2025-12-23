#!/usr/bin/env bash
set -euo pipefail
echo "📜 Tailing dev logs (Ctrl+C to stop)…"
echo
echo "=== .dev_express.log (last 120, then follow) ==="
tail -n 120 -f .dev_express.log
