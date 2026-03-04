#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
WEB="$ROOT/web"

echo "=== prisma generate (safe) ==="
test -d "$WEB" || { echo "✗ missing $WEB"; exit 1; }

cd "$WEB"

echo "=== node/npm ==="
node -v
npm -v

echo ""
echo "=== find schema.prisma ==="
# Prefer web/prisma/schema.prisma, otherwise search common locations
SCHEMA=""
if [ -f "prisma/schema.prisma" ]; then
  SCHEMA="prisma/schema.prisma"
else
  # search within web first, then repo
  CANDIDATES="$(find . .. -maxdepth 4 -path '*/node_modules/*' -prune -o -name schema.prisma -print | head -n 10 || true)"
  if [ -n "${CANDIDATES}" ]; then
    # pick first match
    SCHEMA="$(echo "$CANDIDATES" | head -n 1)"
  fi
fi

if [ -z "$SCHEMA" ] || [ ! -f "$SCHEMA" ]; then
  echo "✗ Could not find schema.prisma (searched web + repo up to depth 4)."
  exit 1
fi

echo "✓ schema: $SCHEMA"

echo ""
echo "=== run prisma generate ==="
# Use npx so it uses the prisma version in web/package.json
npx prisma generate --schema "$SCHEMA"

echo ""
echo "=== verify generated client exists ==="
test -d "node_modules/.prisma/client" && echo "✓ node_modules/.prisma/client exists" || {
  echo "✗ node_modules/.prisma/client missing after generate"
  exit 1
}

echo ""
echo "=== verify @prisma/client import works (no DB call) ==="
node -e "import { PrismaClient } from '@prisma/client'; const p=new PrismaClient(); console.log('✓ PrismaClient constructed'); await p.\$disconnect();"

echo ""
echo "✓ prisma generate + import verification complete"
