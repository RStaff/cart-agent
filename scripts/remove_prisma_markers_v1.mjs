#!/usr/bin/env node
import fs from "fs";
import path from "path";

const FILE = path.join("web", "prisma", "schema.prisma");

if (!fs.existsSync(FILE)) {
  console.error("❌ Could not find", FILE);
  process.exit(1);
}

const src = fs.readFileSync(FILE, "utf8");
const backupPath =
  FILE + ".before_remove_markers_" + Date.now() + ".prisma";

fs.writeFileSync(backupPath, src, "utf8");

// Remove any line that is just "$MARKER" (with optional whitespace)
// and then collapse 3+ blank lines down to 2.
let updated = src.replace(/^\s*\$MARKER\s*$/gm, "");
updated = updated.replace(/\n{3,}/g, "\n\n");

if (updated === src) {
  console.warn("ℹ️ No $MARKER lines found; file left unchanged.");
} else {
  fs.writeFileSync(FILE, updated, "utf8");
  console.log("💾 Backup saved to:", backupPath);
  console.log("✅ Removed $MARKER lines from schema.prisma.");
}
