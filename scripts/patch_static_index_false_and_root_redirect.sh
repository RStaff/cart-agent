#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
echo "🛠 Patching static middleware to NOT auto-serve index.html, and forcing / redirect..."

cp "$FILE" "$FILE.bak_$(date +%s)" || true

node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// 1) Make express.static NOT serve index.html implicitly
// Convert: app.use(express.static(join(__dirname, "public")));
// To:      app.use(express.static(join(__dirname, "public"), { index: false }));
s = s.replace(
  /app\.use\(\s*express\.static\(\s*join\(__dirname,\s*"public"\)\s*\)\s*\)\s*;/m,
  'app.use(express.static(join(__dirname, "public"), { index: false }));'
);

// 2) Ensure a single root redirect exists (and remove old root handler(s) that sendFile index.html)
s = s.replace(/app\.get\(\s*["']\/["'][\s\S]*?\);\s*/g, "");
// Insert redirect after the onboarding/pricing routes (safe anchor) or after express.json
const anchor = 'app.use(express.json());';
if (s.includes(anchor) && !s.includes('res.redirect(307, "/demo/playground")')) {
  s = s.replace(anchor, anchor + '\napp.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\n');
} else if (!s.includes('res.redirect(307, "/demo/playground")')) {
  s = s + '\napp.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\n';
}

// 3) Add an always-on debug route so you can verify which app is responding
if (!s.includes('app.get("/__whoami"')) {
  s += `
app.get("/__whoami", (_req, res) => {
  res.json({
    ok: true,
    pid: process.pid,
    cwd: process.cwd(),
    file: "web/src/index.js",
    ts: new Date().toISOString()
  });
});
`;
}

fs.writeFileSync(file, s, "utf8");
console.log("✅ Patched web/src/index.js");
NODE
