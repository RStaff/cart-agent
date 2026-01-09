#!/usr/bin/env bash
set -euo pipefail
# Load .env.local if present (robust: preserves quotes/spaces)
if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi
exec "$@"
