import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "app/embedded/page.tsx");
let src = fs.readFileSync(FILE, "utf8");
let updated = src;

// 1) Slightly tighten header flex gap if present
const gapBefore = 'gap-10 md:gap-16';
const gapAfter  = 'gap-8 md:gap-14';

if (updated.includes(gapBefore)) {
  updated = updated.replace(gapBefore, gapAfter);
  console.log("✅ Tightened header gap (gap-10→gap-8, md:gap-16→md:gap-14).");
} else {
  console.log("ℹ️ Header gap pattern not found, skipping gap tweak.");
}

// 2) Pull the stats row a bit closer to the hero copy (mt-10→mt-8)
const mtBefore = 'className="mt-10 grid gap-5 md:grid-cols-3"';
const mtAfter  = 'className="mt-8 grid gap-5 md:grid-cols-3"';

if (updated.includes(mtBefore)) {
  updated = updated.replace(mtBefore, mtAfter);
  console.log("✅ Reduced top margin above stats row (mt-10→mt-8).");
} else {
  console.log("ℹ️ Stats-row margin pattern not found, skipping mt tweak.");
}

// 3) Only write if something actually changed
if (updated === src) {
  console.error("❌ No changes detected. Original file left untouched.");
  process.exit(1);
}

const backupPath = FILE + ".before_micro_tidy_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");
fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("🎨 Micro-tidy complete.");
