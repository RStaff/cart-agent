#!/usr/bin/env bash
set -euo pipefail

FILE="web/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "== web/index.js mount line =="
rg -n 'app\.use\("/api/webhooks",\s*webhooksRouter\)' "$FILE" || true
echo

echo "== web/index.js where webhooksRouter is imported/required =="
rg -n 'webhooksRouter' "$FILE" | head -n 40
echo

echo "== Attempt to extract require/import path for webhooksRouter =="
node - <<'NODE'
import fs from "node:fs";
const s = fs.readFileSync("web/index.js","utf8");

// common patterns
let m =
  s.match(/const\s+webhooksRouter\s*=\s*require\(["']([^"']+)["']\)/) ||
  s.match(/import\s+webhooksRouter\s+from\s+["']([^"']+)["']/) ||
  s.match(/import\s+\{\s*webhooksRouter\s*\}\s+from\s+["']([^"']+)["']/);

if (!m) {
  console.log("❌ Could not auto-detect the import/require path for webhooksRouter in web/index.js");
  process.exit(2);
}
console.log("DETECTED_PATH=" + m[1]);
NODE
