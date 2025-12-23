#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

BK="${FILE}.bak_$(date +%s)"
cp "$FILE" "$BK"
echo "✅ Backup: $BK"

node <<'NODE'
const fs = require("fs");

const file = "web/src/routes/webhooks.js";
let s = fs.readFileSync(file, "utf8");

// 1) Ensure we have the header vars (these already exist in your file)
if (!s.includes('const topicHeader = req.get("x-shopify-topic");')) {
  throw new Error("Expected topicHeader line not found. Aborting to avoid bad patch.");
}
if (!s.includes('const shopHeader = req.get("x-shopify-shop-domain");')) {
  throw new Error("Expected shopHeader line not found. Aborting to avoid bad patch.");
}

// 2) Replace topic/shop assignment block safely
// Old:
// const topic = topicHeader || req.query?.topic || "unknown";
// const shop  = shopHeader  || req.query?.shop  || "unknown";
// New (query first):
// const topic = req.query?.topic || topicHeader || "unknown";
// const shop  = req.query?.shop  || shopHeader  || "unknown";

const reTopic = /const topic\s*=\s*topicHeader\s*\|\|\s*req\.query\?\.\s*topic\s*\|\|\s*"unknown";/;
const reShop  = /const shop\s*=\s*shopHeader\s*\|\|\s*req\.query\?\.\s*shop\s*\|\|\s*"unknown";/;

if (!reTopic.test(s) || !reShop.test(s)) {
  // Try alternate whitespace pattern (some sed/patches can alter spacing)
  const reTopic2 = /const topic\s*=\s*topicHeader\s*\|\|\s*req\.query\?\.\s*topic\s*\|\|\s*['"]unknown['"]\s*;/;
  const reShop2  = /const shop\s*=\s*shopHeader\s*\|\|\s*req\.query\?\.\s*shop\s*\|\|\s*['"]unknown['"]\s*;/;
  if (!reTopic2.test(s) || !reShop2.test(s)) {
    throw new Error("Could not find expected topic/shop assignment lines to replace. Aborting.");
  }
  s = s.replace(reTopic2, 'const topic = req.query?.topic || topicHeader || "unknown";');
  s = s.replace(reShop2,  'const shop = req.query?.shop || shopHeader || "unknown";');
} else {
  s = s.replace(reTopic, 'const topic = req.query?.topic || topicHeader || "unknown";');
  s = s.replace(reShop,  'const shop = req.query?.shop || shopHeader || "unknown";');
}

fs.writeFileSync(file, s);
console.log("✅ Patched query-first shop/topic identity:", file);
NODE

echo "🔍 Sanity:"
node --check "$FILE"
echo "✅ ESM syntax OK"

echo
echo "🔎 Show patched lines:"
grep -nE 'const (topic|shop) = ' "$FILE" | sed -n '1,6p'
