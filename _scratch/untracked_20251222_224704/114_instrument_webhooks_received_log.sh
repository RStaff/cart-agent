#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

# Insert a very small log block right after the first occurrence of "router" creation
# (works for typical Express router files)
perl -0777 -i -pe '
  if ($. == 0) {}
  s/(const\s+router\s*=\s*[^;]+;\s*\n)/$1\n\/\/ [webhooks] instrumentation\nrouter.use((req, _res, next) => {\n  try {\n    console.log(\"[webhooks] received\", req.method, req.originalUrl || req.url, {\n      has_x_shopify_topic: !!req.headers[\"x-shopify-topic\"],\n      has_x_shopify_shop_domain: !!req.headers[\"x-shopify-shop-domain\"],\n      has_x_shopify_hmac_sha256: !!req.headers[\"x-shopify-hmac-sha256\"],\n      content_type: req.headers[\"content-type\"],\n      content_length: req.headers[\"content-length\"],\n    });\n  } catch (_e) {}\n  next();\n});\n\n/s;
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ webhooks.js parses"

echo
echo "🔁 Restart Express (keep Next running if you want)"
lsof -ti tcp:3000 | xargs -r kill -9 || true
./scripts/dev.sh cart-agent-dev.myshopify.com
