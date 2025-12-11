#!/usr/bin/env node

import fs from "fs";
import path from "path";

const FILE = path.join("app", "embedded", "page.tsx");

let src = fs.readFileSync(FILE, "utf8");
let updated = src;

// 1) Tighten the right-hand stack: gap-4 -> gap-3
if (updated.includes('flex flex-col items-end gap-4')) {
  updated = updated.replace(
    'flex flex-col items-end gap-4',
    'flex flex-col items-end gap-3'
  );
  console.log("✅ Tightened right header stack gap (gap-4 → gap-3).");
} else {
  console.warn("⚠️ Right header container class not found; skipped gap tweak.");
}

// 2) Remove the 'Embedded in Shopify admin' label line
const spanRegex =
  /[^\S\r\n]*<span className="[^"]*">Embedded in Shopify admin<\/span>\r?\n?/;

if (spanRegex.test(updated)) {
  updated = updated.replace(spanRegex, "");
  console.log("✅ Removed 'Embedded in Shopify admin' label.");
} else {
  console.warn("⚠️ 'Embedded in Shopify admin' span not found; skipped removal.");
}

// 3) If nothing changed, bail out
if (updated === src) {
  console.error("❌ No changes detected. Original file left untouched.");
  process.exit(1);
}

// 4) Write backup + updated file
const backupPath = FILE + ".before_built_for_cleanup_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");
fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("🎯 Embedded header cleaned up (Built-for badge + no extra text).");
