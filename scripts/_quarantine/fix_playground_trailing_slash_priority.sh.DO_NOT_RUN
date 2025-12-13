#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
echo "🧠 Ensuring /demo/playground is handled before static middleware in $TARGET"

cp "$TARGET" "$TARGET.bak_$(date +%s)" || true

node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Remove any existing handlers we added (so this is idempotent)
s = s.replace(/app\.get\(\"\/demo\/playground\"[\s\S]*?\);\s*/g, "");
s = s.replace(/app\.get\(\"\/demo\/playground\/\"[\s\S]*?\);\s*/g, "");

// Create a canonical handler block (handles both with and without trailing slash)
const handler = `
app.get("/demo/playground", (_req, res) => {
  return res.sendFile(join(FRONTEND_DIST, "index.html"));
});
app.get("/demo/playground/", (_req, res) => {
  return res.sendFile(join(FRONTEND_DIST, "index.html"));
});
`;

// Insert this block BEFORE the frontend static mount so it wins
const staticLine = 'app.use(express.static(FRONTEND_DIST, { index: false }));';
if (!s.includes(staticLine)) {
  throw new Error("Could not find the FRONTEND_DIST static mount line.");
}

s = s.replace(staticLine, handler + "\n" + staticLine);

fs.writeFileSync(file, s, "utf8");
console.log("✅ /demo/playground handlers inserted before static.");
NODE
