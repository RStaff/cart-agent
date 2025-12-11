import fs from "fs";

const FILE = "app/embedded/page.tsx";

if (!fs.existsSync(FILE)) {
  console.error("❌ Could not find app/embedded/page.tsx");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");

// We’ll remove the entire <p>...</p> that contains this text:
const marker = "Embedded in Shopify admin";
const markerIndex = src.indexOf(marker);

if (markerIndex === -1) {
  console.error("❌ Could not find 'Embedded in Shopify admin' in page.tsx. No changes made.");
  process.exit(1);
}

// Find the start of the <p ...> that contains the marker
const pStart = src.lastIndexOf("<p", markerIndex);
const pEnd = src.indexOf("</p>", markerIndex);

if (pStart === -1 || pEnd === -1) {
  console.error("❌ Could not safely locate surrounding <p>...</p>. No changes made.");
  process.exit(1);
}

const before = src.slice(0, pStart);
const after = src.slice(pEnd + "</p>".length);

// Backup original file
const backupPath = FILE + ".before_remove_embedded_label_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

// Write updated file
fs.writeFileSync(FILE, before + after, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ Removed the 'Embedded in Shopify admin' header label. Shopify badge + button left as-is.");
