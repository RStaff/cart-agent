import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../app/demo/playground/page.tsx");

console.log("🔧 Patching 7-day snapshot hover UI in demo/playground…");

let text = fs.readFileSync(filePath, "utf8");

// Make sure the section exists
const marker = "7-day recovered orders snapshot";
if (!text.includes(marker)) {
  console.log("⚠️ Could not find '7-day recovered orders snapshot' section. No changes made.");
  process.exit(0);
}

// Limit our edits to the block between the 7-day section and the next section heading
const start = text.indexOf(marker);
const nextHeading = "What the raw signal looks like";
const end = text.indexOf(nextHeading, start);

const blockEnd = end === -1 ? text.length : end;
const before = text.slice(0, start);
let block = text.slice(start, blockEnd);
const after = text.slice(blockEnd);

// Inside that block, upgrade any "pill" with rounded-full + border to have hover styles.
const chipRegex = /className="([^"]*?\\brounded-full\\b[^"]*?\\bborder\\b[^"]*)"/g;

let chipCount = 0;
block = block.replace(chipRegex, (match, classes) => {
  // If it already has a hover style, leave it alone
  if (classes.includes("hover:bg-") || classes.includes("hover:-translate-y-1")) {
    return match;
  }

  const extra =
    " cursor-pointer transition-colors duration-150 hover:bg-emerald-500/15 " +
    "hover:border-emerald-500/70 hover:text-emerald-100";

  chipCount += 1;
  return `className="${classes}${extra}"`;
});

text = before + block + after;
fs.writeFileSync(filePath, text, "utf8");

if (chipCount > 0) {
  console.log(`✅ Added hover styling to ${chipCount} day chip(s) in the 7-day snapshot section.`);
} else {
  console.log("ℹ️ No day chips needed changes (they may already have hover styles).");
}
