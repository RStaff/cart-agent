#!/usr/bin/env bash
# Lightweight placeholder that always succeeds.
# Keeps the CI job structure intact until we implement real policy.
set -euo pipefail
cmd="${1:-check}"
echo "deps-guard: ${cmd} (placeholder) — OK"
exit 0
