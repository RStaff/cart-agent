#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

node - <<'NODE'
import fs from "node:fs";

const file = "web/src/routes/webhooks.js";
let s = fs.readFileSync(file, "utf8");

// Anchor: the "const secret = process.env..." block
const secretBlockRe =
/const\s+secret\s*=\s*\n\s*process\.env\.SHOPIFY_API_SECRET\s*\|\|\s*\n\s*process\.env\.SHOPIFY_API_SECRET_KEY\s*\|\|\s*\n\s*process\.env\.SHOPIFY_APP_SECRET\s*\|\|\s*\n\s*process\.env\.SHOPIFY_SECRET\s*\|\|\s*\n\s*null\s*;/m;

if (!secretBlockRe.test(s)) {
  console.error("❌ Could not find the `const secret = ...` block to patch.");
  console.error("   Run: grep -n \"const secret\" web/src/routes/webhooks.js");
  process.exit(1);
}

const replacement = `const secretRaw =
  process.env.SHOPIFY_API_SECRET ||
  process.env.SHOPIFY_API_SECRET_KEY ||
  process.env.SHOPIFY_APP_SECRET ||
  process.env.SHOPIFY_SECRET ||
  null;

// Normalize secret: trim whitespace + strip wrapping quotes if present
const secret = secretRaw
  ? String(secretRaw).trim().replace(/^['"]|['"]$/g, "")
  : null;`;

s = s.replace(secretBlockRe, replacement);

// Ensure debug log includes a safe secret fingerprint
// Anchor inside the ABANDO_DEBUG_HMAC console.log object and add secretFp
const hmacDebugRe = /console\.log\(\s*"\[webhooks\]\[hmac-debug\]"\s*,\s*\{\s*([\s\S]*?)\s*\}\s*\)\s*;/m;

if (!hmacDebugRe.test(s)) {
  console.error("❌ Could not find [webhooks][hmac-debug] console.log block to patch.");
  console.error("   Run: grep -n \"\\[webhooks\\]\\[hmac-debug\\]\" web/src/routes/webhooks.js");
  process.exit(1);
}

if (!s.includes("secretFp:")) {
  s = s.replace(hmacDebugRe, (m, inner) => {
    // insert secretFp near secretKeyUsed
    const insert = `secretFp: (secret ? (await import("node:crypto")).createHash("sha256").update(String(secret)).digest("hex").slice(0, 12) : null),\n      `;
    if (inner.includes("secretKeyUsed")) {
      return m.replace("secretKeyUsed,", `secretKeyUsed,\n      ${insert}`);
    }
    // fallback: prepend
    return `console.log("[webhooks][hmac-debug]", {\n      ${insert}${inner}\n    });`;
  });

  // The above uses dynamic import in object if we inserted that way; instead, patch safely by adding a top import.
  // If node:crypto is already imported (it is), we can just use createHash. Let's ensure it's imported.
  if (!s.includes("createHash")) {
    // Expand the existing crypto import to include createHash
    s = s.replace(
      /import\s+\{\s*createHmac\s*,\s*timingSafeEqual\s*\}\s+from\s+"node:crypto";/,
      'import { createHmac, timingSafeEqual, createHash } from "node:crypto";'
    );
    // Replace any createHash usage we inserted via dynamic import with direct createHash
    s = s.replace(/\(await import\("node:crypto"\)\)\.createHash/g, "createHash");
  }
}

fs.writeFileSync(file, s);
console.log("✅ Patched: normalize Shopify secret + add safe secret fingerprint to HMAC debug.");
NODE

echo "🔍 Sanity:"
node --check "$FILE"
echo "✅ ESM syntax OK"

echo
echo "🔎 Show secret normalization lines:"
grep -nE "const secretRaw|Normalize secret|const secret =" "$FILE" | sed -n '1,120p'

echo
echo "🔎 Confirm debug includes secretFp:"
grep -nE "secretFp" "$FILE" | head -n 5
