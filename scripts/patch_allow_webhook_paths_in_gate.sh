#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

TS="$(date +%s)"
cp "$FILE" "$FILE.bak_$TS"
echo "📦 Backup: $FILE.bak_$TS"

node - <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Ensure webhook paths are present in any allowlist array that already contains "/api/webhooks"
function ensureInAllowlist(str, needle, add) {
  if (!str.includes(needle)) return str;

  // add entries if missing
  for (const p of add) {
    if (!str.includes(`"${p}"`) && !str.includes(`'${p}'`)) {
      // insert right after needle occurrence inside an array if possible
      str = str.replace(
        new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\]]*)\\]`),
        (m, inside) => {
          if (m.includes(p)) return m;
          return inside + `  "${p}",\n]`;
        }
      );
    }
  }
  return str;
}

// 1) Make sure both are in the allowlist somewhere near "/api/webhooks"
s = ensureInAllowlist(s, `"/api/webhooks"`, ["/api/webhooks/gdpr"]);
s = ensureInAllowlist(s, `'/api/webhooks'`, ["/api/webhooks/gdpr"]);

// 2) If the gate uses exact match, relax it to prefix-match for /api/webhooks*
// Common patterns:
//   allowedPaths.includes(req.path)
// Replace with:
//   allowedPaths.some(p => req.path === p || req.path.startsWith(p + "/"))
s = s.replace(
  /allowedPaths\.includes\((req\.(?:path|url))\)/g,
  'allowedPaths.some(p => $1 === p || $1.startsWith(p + "/"))'
);

fs.writeFileSync(file, s);
console.log("✅ Patched gate to allow /api/webhooks and /api/webhooks/*");
NODE

echo "🔎 Confirm allowlist + gate logic:"
rg -n '/api/webhooks/gdpr|allowedPaths\.some|allowedPaths\.includes|Invalid path' "$FILE" || true

echo "✅ Patch complete."
