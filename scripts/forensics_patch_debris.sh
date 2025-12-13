#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Patch debris (likely fragile leftovers) =="

echo ""
echo "-- Backups / .bak / before_ / backup_ / .orig / .old --"
find . \
  -path './.git' -prune -o \
  -type f \( \
    -name '*.bak' -o -name '*.bak_*' -o -name '*.backup*' -o -name '*.orig' -o -name '*.old' -o \
    -name '*before_*' -o -name '*backup_*' -o -name '*.before_*' \
  \) -print | sed 's|^\./||' | sort

echo ""
echo "-- Prisma schema backups --"
find web/prisma -type f -name 'schema.prisma*' 2>/dev/null | sed 's|^\./||' | sort || true

echo ""
echo "-- API server snapshots --"
find api -type f -name '*.before_*' 2>/dev/null | sed 's|^\./||' | sort || true
