#!/usr/bin/env node
import fs from "fs";

const FILE = "app/embedded/page.tsx";

let src = fs.readFileSync(FILE, "utf8");

// Case-insensitive match for the label text *anywhere* in the file
const labelRegex = /Embedded in Shopify admin/gi;

if (!labelRegex.test(src)) {
  console.error("❌ Could not find 'Embedded in Shopify admin' text in", FILE);
  console.error("   (It might already be gone; leaving file untouched.)");
  process.exit(1);
}

// Make a backup **before** changing anything
const backupPath = FILE + ".before_remove_embedded_label_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

// Remove the text, but keep the surrounding JSX structure intact
let updated = src.replace(labelRegex, "");

// Tiny cleanup: collapse any extra spaces right before a closing span tag
updated = updated.replace(/\s+<\/span>/g, "</span>");

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("✅ Removed all 'Embedded in Shopify admin' text from the embedded header.");
