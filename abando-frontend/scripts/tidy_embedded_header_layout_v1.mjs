#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "app/embedded/page.tsx");

let src = fs.readFileSync(FILE, "utf8");
let updated = src;

// 1) Tidy the header flex layout (center Shopify block, tighten gaps)
const beforeHeader =
  'className="flex flex-col md:flex-row md:justify-between md:items-start gap-10 md:gap-16"';
const afterHeader =
  'className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12"';

if (updated.includes(beforeHeader)) {
  updated = updated.replace(beforeHeader, afterHeader);
  console.log("✅ Updated header flex layout (centering + tighter gaps).");
} else {
  console.warn("⚠️ Header layout string not found; leaving it as-is.");
}

// 2) Slightly reduce vertical padding on the main container (py-10 → py-8)
const beforeMain = 'className="mx-auto max-w-6xl px-6 py-10"';
const afterMain = 'className="mx-auto max-w-6xl px-6 py-8"';

if (updated.includes(beforeMain)) {
  updated = updated.replace(beforeMain, afterMain);
  console.log("✅ Reduced main vertical padding (py-10 → py-8).");
} else {
  console.warn("⚠️ Main container padding string not found; leaving it as-is.");
}

// 3) Write changes if anything actually changed
if (updated === src) {
  console.error("❌ No changes detected. Original file left untouched.");
  process.exit(1);
}

const backupPath = FILE + ".before_tidy_layout_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");
fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("✅ Embedded header layout tidied successfully.");
