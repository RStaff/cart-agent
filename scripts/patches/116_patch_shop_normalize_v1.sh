#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"

if [[ ! -f "$FILE" ]]; then
  echo "✗ Missing $FILE"
  exit 1
fi

echo "=== preflight ==="
node -c "$FILE" >/dev/null
echo "✓ node -c ok (before)"

BACKUP="${FILE}.bak_$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "$BACKUP" >/dev/null
echo "✓ backup: $BACKUP"

node <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// 1) Insert normalizeShop helper if missing
if (!s.includes("ABANDO_SHOP_NORMALIZE_V1")) {
  const block =
`
// ABANDO_SHOP_NORMALIZE_V1
function normalizeShop(raw) {
  if (!raw) return "";
  let v = String(raw).trim().toLowerCase();

  // strip protocol
  v = v.replace(/^https?:\\/\\//, "");

  // strip path/query/hash
  v = v.split("/")[0].split("?")[0].split("#")[0];

  // if user passed "shopname" only, add suffix
  if (v && !v.includes(".")) v = \`\${v}.myshopify.com\`;

  // allow only *.myshopify.com
  if (!v.endsWith(".myshopify.com")) return "";

  // basic hostname sanity
  if (!/^[a-z0-9][a-z0-9-]*\\.myshopify\\.com$/.test(v)) return "";

  return v;
}
// /ABANDO_SHOP_NORMALIZE_V1
`;

  // Insert after verifyShopifyHmac(...) helper (preferred), else after verifyShopifyWebhookHmac(...), else near top.
  const idx1 = s.indexOf("function verifyShopifyHmac(");
  if (idx1 >= 0) {
    // find end of that function block by locating the next "\n}" after its start, then insert after it.
    const end = s.indexOf("\n}", idx1);
    if (end >= 0) {
      s = s.slice(0, end + 3) + block + s.slice(end + 3);
    } else {
      // fallback: insert at top after imports
      const firstBlank = s.indexOf("\n\n");
      s = s.slice(0, firstBlank + 2) + block + s.slice(firstBlank + 2);
    }
  } else {
    const idx2 = s.indexOf("function verifyShopifyWebhookHmac(");
    if (idx2 >= 0) {
      const end = s.indexOf("\n}", idx2);
      if (end >= 0) {
        s = s.slice(0, end + 3) + block + s.slice(end + 3);
      } else {
        const firstBlank = s.indexOf("\n\n");
        s = s.slice(0, firstBlank + 2) + block + s.slice(firstBlank + 2);
      }
    } else {
      const firstBlank = s.indexOf("\n\n");
      s = s.slice(0, firstBlank + 2) + block + s.slice(firstBlank + 2);
    }
  }
}

// 2) Rewrite shop assignment lines that reference req.query.shop to use normalizeShop(req.query.shop)
// Do this line-by-line so we don’t accidentally touch other variables.
const lines = s.split("\n");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Skip if already normalized
  if (line.includes("normalizeShop(req.query.shop")) continue;

  // Match const/let shop assignments that reference req.query.shop
  const m = line.match(/^(\s*)(const|let)\s+shop\s*=\s*.*req\.query\.shop.*;?\s*$/);
  if (m) {
    const indent = m[1] || "";
    const decl = m[2] || "const";
    lines[i] = `${indent}${decl} shop = normalizeShop(req.query.shop);`;
  }
}
s = lines.join("\n");

// 3) Simplify the "Invalid shop" guard patterns
// Replace: if (!shop || !shop.endsWith(".myshopify.com")) return res.status(400).send("Invalid shop");
s = s.replace(
  /if\s*\(\s*!shop\s*\|\|\s*!shop\.endsWith\("\.myshopify\.com"\)\s*\)\s*return\s*res\.status\(\s*400\s*\)\.send\(\s*"Invalid shop"\s*\)\s*;/g,
  'if (!shop) return res.status(400).send("Invalid shop");'
);

// Also handle variants without the leading !shop
s = s.replace(
  /if\s*\(\s*!shop\.endsWith\("\.myshopify\.com"\)\s*\)\s*return\s*res\.status\(\s*400\s*\)\.send\(\s*"Invalid shop"\s*\)\s*;/g,
  'if (!shop) return res.status(400).send("Invalid shop");'
);

fs.writeFileSync(file, s, "utf8");
NODE

echo "=== postflight ==="
node -c "$FILE" >/dev/null
echo "✓ node -c ok (after)"

echo ""
echo "=== sanity grep (should find normalize + Invalid shop guards) ==="
grep -n "ABANDO_SHOP_NORMALIZE_V1" -n "$FILE" | head -n 5 || true
grep -n 'send("Invalid shop")' "$FILE" | head -n 20 || true
grep -n 'normalizeShop(req.query.shop' "$FILE" | head -n 20 || true

echo ""
echo "=== diff ==="
git diff -- "$FILE" | sed -n '1,220p'
