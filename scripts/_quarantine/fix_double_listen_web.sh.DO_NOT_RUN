#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"

echo "🧹 Fixing double-listen: moving app.listen out of $TARGET (start.mjs should own listen)..."

cp "$TARGET" "$TARGET.bak_$(date +%s)" || true

node << 'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// 1) Remove app.listen(...) block if present
// This is a best-effort removal that targets the first occurrence of app.listen( ... );
const listenIdx = s.indexOf("app.listen(");
if (listenIdx !== -1) {
  // Find the end of the statement by scanning forward to the first ");" after it
  const endIdx = s.indexOf(");", listenIdx);
  if (endIdx !== -1) {
    const before = s.slice(0, listenIdx);
    const after = s.slice(endIdx + 2);
    s = before + "\n// (listen moved to start.mjs)\n" + after;
  }
}

// 2) Ensure we export the app (so start.mjs can attach it)
if (!s.includes("export default app")) {
  s = s.trimEnd() + "\n\nexport default app;\n";
}

fs.writeFileSync(file, s, "utf8");
console.log("✅ Updated web/src/index.js (backup created).");
NODE
