#!/usr/bin/env bash
set -euo pipefail

echo "[start] node: $(node -v)"
echo "[start] cwd: $(pwd)  |  PORT=${PORT:-<unset>}"

# apply migrations (generate already ran during build)
npx prisma migrate deploy --schema prisma/schema.prisma

# Start only the web (workers should be separate services)
node start.js
