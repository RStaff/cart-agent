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

// 1) Patch crypto import to include timingSafeEqual
// from: import { createHmac } from "node:crypto";
// to:   import { createHmac, timingSafeEqual } from "node:crypto";
s = s.replace(
  /import\s*\{\s*createHmac\s*\}\s*from\s*"node:crypto";/g,
  'import { createHmac, timingSafeEqual } from "node:crypto";'
);

// 2) Replace HMAC computation block with robust version
// We look for the current block starting at: const hmac = req.get("x-shopify-hmac-sha256");
const re = /const hmac\s*=\s*req\.get\("x-shopify-hmac-sha256"\);\s*\n\s*const secret\s*=\s*process\.env\.[^\n]*\n\s*\n\s*let hmacOk\s*=\s*false;[\s\S]*?\n\s*}\s*\n/;

if (!re.test(s)) {
  throw new Error("Could not locate existing HMAC block to replace. Aborting.");
}

const replacement =
`const hmacHeader = (req.get("x-shopify-hmac-sha256") || "").trim();

// Prefer the real Shopify API secret. Support common env var names to avoid mismatches.
const secret =
  process.env.SHOPIFY_API_SECRET ||
  process.env.SHOPIFY_API_SECRET_KEY ||
  process.env.SHOPIFY_APP_SECRET ||
  process.env.SHOPIFY_SECRET ||
  null;

let hmacOk = false;
let secretKeyUsed = null;

if (secret) {
  secretKeyUsed =
    process.env.SHOPIFY_API_SECRET ? "SHOPIFY_API_SECRET" :
    process.env.SHOPIFY_API_SECRET_KEY ? "SHOPIFY_API_SECRET_KEY" :
    process.env.SHOPIFY_APP_SECRET ? "SHOPIFY_APP_SECRET" :
    process.env.SHOPIFY_SECRET ? "SHOPIFY_SECRET" :
    "unknown";
}

if (hmacHeader && secret) {
  // Shopify computes HMAC over the raw request body bytes
  const digestB64 = createHmac("sha256", secret).update(raw).digest("base64");

  // Compare as bytes (base64 -> bytes) using timingSafeEqual to avoid subtle string issues
  try {
    const a = Buffer.from(digestB64, "base64");
    const b = Buffer.from(hmacHeader, "base64");
    hmacOk = (a.length === b.length) && timingSafeEqual(a, b);
  } catch (_e) {
    hmacOk = false;
  }

  if (process.env.ABANDO_DEBUG_HMAC === "1") {
    console.log("[webhooks][hmac-debug]", {
      secretKeyUsed,
      rawBytes: raw.length,
      headerPresent: Boolean(hmacHeader),
      computedDigestBytes: Buffer.from(digestB64, "base64").length,
      headerDigestBytes: (() => { try { return Buffer.from(hmacHeader, "base64").length; } catch { return null; } })(),
      hmacOk,
    });
  }
}
`;

s = s.replace(re, replacement + "\n");

fs.writeFileSync(file, s);
console.log("✅ Patched robust HMAC verification:", file);
NODE

echo "🔍 Sanity:"
node --check "$FILE"
echo "✅ ESM syntax OK"

echo
echo "🔎 Confirm crypto import + hmacHeader block:"
grep -nE 'timingSafeEqual|const hmacHeader|secretKeyUsed|hmacOk = \(a\.length' "$FILE" | sed -n '1,120p'
