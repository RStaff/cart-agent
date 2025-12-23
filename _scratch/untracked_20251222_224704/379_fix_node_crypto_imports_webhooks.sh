#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

node - <<'NODE'
import fs from "node:fs";

const file = "web/src/routes/webhooks.js";
let s = fs.readFileSync(file, "utf8");

// 1) Remove common broken/duplicate crypto import styles
s = s
  .replace(/^\s*import\s+crypto\s+from\s+["']node:crypto["'];\s*\n/gm, "")
  .replace(/^\s*import\s+\*\s+as\s+crypto\s+from\s+["']node:crypto["'];\s*\n/gm, "")
  .replace(/^\s*const\s+crypto\s*=\s*await\s+import\(["']node:crypto["']\);\s*\n/gm, "");

// 2) Ensure we have ONE correct import line (after other imports if any)
const goodImport = `import { createHash, createHmac, timingSafeEqual } from "node:crypto";\n`;

if (!s.includes(goodImport.trim())) {
  if (/^\s*import[^\n]*\n/m.test(s)) {
    // insert after last import line
    const lines = s.split("\n");
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*import\b/.test(lines[i])) lastImportIdx = i;
    }
    lines.splice(lastImportIdx + 1, 0, goodImport.trimEnd());
    s = lines.join("\n");
  } else {
    s = goodImport + s;
  }
}

// 3) Rewrite any usage of crypto.createHash / createHmac / timingSafeEqual
s = s
  .replace(/\bcrypto\.createHash\b/g, "createHash")
  .replace(/\bcrypto\.createHmac\b/g, "createHmac")
  .replace(/\bcrypto\.timingSafeEqual\b/g, "timingSafeEqual");

fs.writeFileSync(file, s, "utf8");
console.log("✅ Patched node:crypto imports/usages in " + file);
NODE

# Nudge for nodemon (Shopify CLI UI sometimes eats 'rs')
touch "$FILE"

echo "✅ Done. Nodemon should restart automatically."
