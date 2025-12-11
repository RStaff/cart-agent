#!/usr/bin/env node
import fs from "fs";

const FILE = "app/embedded/page.tsx";

let src = fs.readFileSync(FILE, "utf8");

// Remove ANY span whose inner text is exactly "Embedded in Shopify admin"
const spanRegex = /<span[^>]*>Embedded in Shopify admin<\/span>\s*/g;
const updated = src.replace(spanRegex, "");

if (updated === src) {
  console.error("❌ No 'Embedded in Shopify admin' span found. Original file left untouched.");
  process.exit(1);
}

const backupPath = FILE + ".before_strip_embedded_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");
fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup saved:", backupPath);
console.log("✅ Removed 'Embedded in Shopify admin' label from header.");
