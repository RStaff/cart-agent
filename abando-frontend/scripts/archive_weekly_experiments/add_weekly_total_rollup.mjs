#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, "..", "app", "demo", "playground", "page.tsx");

console.log("🔧 Adding weekly total roll-up to 7-day snapshot…");

// 1) Load file
let text = fs.readFileSync(file, "utf8");

// 2) Bail if we've already added the roll-up once
if (text.includes("Across the full week, this demo recovers just over")) {
  console.log("ℹ️ Weekly total roll-up already present. No changes made.");
  process.exit(0);
}

// 3) Find the 7-day snapshot heading
const heading = "7-day recovered orders snapshot";
const headingIndex = text.indexOf(heading);

if (headingIndex === -1) {
  console.log("⚠️ Could not find the 7-day snapshot heading. No changes made.");
  process.exit(0);
}

// 4) Starting from the heading, find the FIRST <p> tag (the description)
const pStart = text.indexOf("<p", headingIndex);
if (pStart === -1) {
  console.log("⚠️ Found heading but no paragraph after it. No changes made.");
  process.exit(0);
}

const pEnd = text.indexOf("</p>", pStart);
if (pEnd === -1) {
  console.log("⚠️ Found paragraph start but no closing </p>. No changes made.");
  process.exit(0);
}

// 5) Build the new weekly roll-up paragraph
const insert = `
<p className="mt-3 text-sm text-emerald-300">
  Across the full week, this demo recovers just over
  <span className="font-semibold">$5,000</span> in orders that would have
  been lost — all from small, pattern-driven plays instead of blanket discounts.
</p>
`;

// 6) Backup file once before writing
const backupPath = file.replace(
  /page\.tsx$/,
  `page.tsx.before_weekly_total_${Date.now()}.tsx`
);
fs.writeFileSync(backupPath, text, "utf8");
console.log("💾 Backup written to", path.basename(backupPath));

// 7) Inject new paragraph AFTER the existing description
const injectionPoint = pEnd + "</p>".length;
const newText = text.slice(0, injectionPoint) + insert + text.slice(injectionPoint);

fs.writeFileSync(file, newText, "utf8");
console.log("✅ Added weekly total roll-up under the 7-day snapshot.");
