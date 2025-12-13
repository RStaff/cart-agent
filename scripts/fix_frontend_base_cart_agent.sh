#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
echo "🩹 Adding /cart-agent static mount for Vite-built assets in $TARGET"

cp "$TARGET" "$TARGET.bak_$(date +%s)" || true

node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

const mountLine = 'app.use("/cart-agent", express.static(FRONTEND_DIST, { index: false }));';

// Add mount right after the existing FRONTEND_DIST static mount
const existing = 'app.use(express.static(FRONTEND_DIST, { index: false }));';

if (!s.includes(existing)) {
  throw new Error("Could not find existing FRONTEND_DIST static mount.");
}

if (!s.includes(mountLine)) {
  s = s.replace(existing, existing + "\n" + mountLine);
}

fs.writeFileSync(file, s, "utf8");
console.log("✅ Added /cart-agent → FRONTEND_DIST static mount.");
NODE
