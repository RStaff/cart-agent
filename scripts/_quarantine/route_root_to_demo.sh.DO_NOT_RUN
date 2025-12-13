#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
echo "🔁 Redirecting / → /demo/playground in $TARGET"

cp "$TARGET" "$TARGET.bak_$(date +%s)" || true

node << 'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Replace the exact root handler if present
s = s.replace(
  /app\.get\("\/",\s*\(_req,\s*res\)\s*=>\s*res\.sendFile\([^\)]*\)\s*\);\s*/m,
  'app.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\n'
);

// If it didn't find it, add a redirect near the other routes (safe fallback)
if (!s.includes('res.redirect(307, "/demo/playground")')) {
  const insertAfter = 'app.use(express.static(join(__dirname, "public")));';
  if (s.includes(insertAfter)) {
    s = s.replace(insertAfter, insertAfter + '\napp.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\n');
  }
}

fs.writeFileSync(file, s, "utf8");
console.log("✅ Root route updated.");
NODE
