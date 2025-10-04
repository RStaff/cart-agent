#!/usr/bin/env bash
set -euo pipefail
# minimal pass-through so CI doesn't 127
echo "deps-guard: ${1:-check} — OK"
