#!/usr/bin/env node
import fs from "fs";

const FILE = "app/embedded/page.tsx";

if (!fs.existsSync(FILE)) {
  console.error("❌ Could not find", FILE);
  process.exit(1);
}

const src = fs.readFileSync(FILE, "utf8");

// This is the current header class string we want to tweak
const before =
  'className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12"';

const after =
  'className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-12"';

if (!src.includes(before)) {
  console.error("❌ Expected header class string not found. Leaving file untouched.");
  process.exit(1);
}

const updated = src.replace(before, after);

if (updated === src) {
  console.error("❌ Replacement produced no diff. Original file left untouched.");
  process.exit(1);
}

const backupPath = FILE + ".before_align_header_top_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");
fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("✅ Header updated: md:items-center → md:items-start (right stack aligned to top).");
