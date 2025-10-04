#!/usr/bin/env sh
set -eu
hit="$(grep -R --line-number --exclude-dir=node_modules --exclude-dir=.next \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  -E '\bapiVersion[[:space:]]*:' src || true)"
if [ -n "$hit" ]; then
  echo "$hit"
  echo "❌ Blocked: Found 'apiVersion:' in source. Remove it and rely on Stripe SDK default."
  exit 1
fi
echo "✅ Stripe guard OK."
