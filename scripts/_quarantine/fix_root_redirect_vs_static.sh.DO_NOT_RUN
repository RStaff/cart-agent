#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
echo "🧩 Fixing: express.static index.html shadowing / redirect in $TARGET"

cp "$TARGET" "$TARGET.bak_$(date +%s)" || true

node << 'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// 1) Disable automatic serving of public/index.html at "/"
s = s.replace(
  /app\.use\(express\.static\(join\(__dirname,\s*"public"\)\)\);/g,
  'app.use(express.static(join(__dirname, "public"), { index: false }));'
);

// 2) Ensure root redirect exists (idempotent)
if (!s.includes('res.redirect(307, "/demo/playground")')) {
  // Insert redirect right after the static middleware line (safe place)
  const marker = 'app.use(express.static(join(__dirname, "public"), { index: false }));';
  if (s.includes(marker)) {
    s = s.replace(marker, marker + '\napp.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\n');
  } else {
    // Fallback: append
    s = s.trimEnd() + '\n\napp.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\n';
  }
}

// 3) Remove the old "sendFile public/index.html" root handler if still present
s = s.replace(
  /app\.get\("\/",\s*\(_req,\s*res\)\s*=>\s*res\.sendFile\(join\(__dirname,"public","index\.html"\)\)\);\s*/g,
  ''
);

fs.writeFileSync(file, s, "utf8");
console.log("✅ Updated static index behavior + root redirect.");
NODE
