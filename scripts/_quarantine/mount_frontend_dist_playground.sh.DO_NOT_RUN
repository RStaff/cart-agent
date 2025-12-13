#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
echo "🧩 Mounting web/frontend/dist as /demo/playground in $TARGET"

cp "$TARGET" "$TARGET.bak_$(date +%s)" || true

node << 'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Add FRONTEND_DIST constant near app creation
if (!s.includes("const FRONTEND_DIST")) {
  const anchor = "const app = express();";
  if (!s.includes(anchor)) throw new Error("Anchor not found: " + anchor);
  s = s.replace(
    anchor,
    anchor + '\n\n// Embedded frontend build output (Vite)\nconst FRONTEND_DIST = join(__dirname, "..", "frontend", "dist");\n'
  );
}

// Serve frontend build assets (index:false so routes control HTML)
if (!s.includes("express.static(FRONTEND_DIST")) {
  const anchor = "app.use(express.json());";
  if (!s.includes(anchor)) throw new Error("Anchor not found: " + anchor);
  s = s.replace(
    anchor,
    anchor + '\n\n// Serve built embedded UI assets\napp.use(express.static(FRONTEND_DIST, { index: false }));\n'
  );
}

// Ensure / redirects to /demo/playground
if (!s.includes('res.redirect(307, "/demo/playground")')) {
  s += '\napp.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\n';
}

// Serve the embedded UI entry for /demo/playground
if (!s.includes('app.get("/demo/playground"')) {
  s += `
app.get("/demo/playground", (_req, res) => {
  return res.sendFile(join(FRONTEND_DIST, "index.html"));
});
`;
}

// Add whoami if missing (debug)
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
console.log("✅ Mounted frontend dist + routes added.");
NODE

echo "✅ Done. Backup saved as $TARGET.bak_*"
