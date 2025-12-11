#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[fix] Fixing /marketing/marketing/women-boutique -> /marketing/women-boutique …"

grep -Rl "/marketing/marketing/women-boutique" app src 2>/dev/null \
  | xargs -I{} perl -pi -e 's#/marketing/marketing/women-boutique#/marketing/women-boutique#g' {}

echo "[fix] Done. Restart dev server to clear the 404."
