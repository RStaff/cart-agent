import fs from "fs";
import path from "path";

const FILE = path.join("app", "embedded", "page.tsx");
let src = fs.readFileSync(FILE, "utf8");

// This class patch fixes alignment & spacing cleanly.
const before = `className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"`;

const after = `className="flex flex-col md:flex-row md:justify-between md:items-start gap-10 md:gap-16"`;

// Apply replacement
if (!src.includes(before)) {
  console.error("❌ Could not find expected header wrapper. No changes made.");
  process.exit(1);
}

const backup = FILE + ".before_layout_fix_" + Date.now() + ".tsx";
fs.writeFileSync(backup, src, "utf8");

src = src.replace(before, after);
fs.writeFileSync(FILE, src, "utf8");

console.log("💾 Backup saved:", backup);
console.log("✅ Header layout spacing fixed (clean centering + aligned Shopify panel).");
