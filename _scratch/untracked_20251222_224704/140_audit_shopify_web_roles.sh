#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

echo "===== A) shopify.app.toml (relevant bits) ====="
test -f shopify.app.toml || { echo "❌ shopify.app.toml not found"; exit 1; }
grep -nE '^\[|^\[\[|application_url|redirect_urls|webhooks|scopes' shopify.app.toml || true
echo

echo "===== B) Find shopify.web.toml files ====="
FILES=$(find . -maxdepth 6 -name "shopify.web.toml" -print || true)
if [[ -z "${FILES}" ]]; then
  echo "❌ No shopify.web.toml found."
  exit 1
fi
echo "$FILES"
echo

echo "===== C) Show each shopify.web.toml (first 200 lines) ====="
for f in $FILES; do
  echo "----- $f -----"
  nl -ba "$f" | sed -n '1,200p'
  echo
done

echo "===== D) Quick roles summary ====="
for f in $FILES; do
  echo "----- $f -----"
  grep -nE 'roles\s*=|type\s*=|command\s*=|directory\s*=|port\s*=' "$f" || echo "(no obvious role/type/command/port lines)"
  echo
done

echo "===== E) Your backend is currently proxying UI routes (from your log) ====="
echo "You showed: [UI PROXY] [/demo,/embedded] -> http://localhost:3001"
echo "That is fine, BUT the SHOPIFY TUNNEL must still reach the backend for /api/*."
echo
echo "NEXT: if roles are missing or wrong, fix them so:"
echo "  - frontend service: roles = [\"frontend\"]"
echo "  - backend service:  roles = [\"backend\"]"
echo
echo "✅ Audit done."
