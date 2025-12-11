import fs from "fs";

const FILE = "app/embedded/page.tsx";
const src = fs.readFileSync(FILE, "utf8");

// We key off the unique bg-emerald-500/15 class used on the circle "A" logo
const needle = 'bg-emerald-500/15';
const idx = src.indexOf(needle);

if (idx === -1) {
  console.error("⚠️ Could not find the header circle 'A' logo div (bg-emerald-500/15). Aborting with NO changes.");
  process.exit(1);
}

// Walk back to the opening <div ...> for that logo block
const openIdx = src.lastIndexOf("<div", idx);
if (openIdx === -1) {
  console.error("⚠️ Could not find opening <div> for the logo block. Aborting with NO changes.");
  process.exit(1);
}

// Grab through the first closing </div> after the needle — that is the circle div
const closingToken = "</div>";
const closeIdx = src.indexOf(closingToken, idx);
if (closeIdx === -1) {
  console.error("⚠️ Could not find closing </div> for the logo block. Aborting with NO changes.");
  process.exit(1);
}

const oldBlock = src.slice(openIdx, closeIdx + closingToken.length);

// New logo block using your inline PNG that already lives in public/abando-logo.inline.png
const newBlock = `      <div className="relative h-9 w-32">
        <Image
          src="/abando-logo.inline.png"
          alt="Abando logo"
          fill
          className="object-contain"
          priority
        />
      </div>`;

// Backup original file
const backupPath = FILE + ".before_logo_swap_v2_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

// Replace old logo block with the PNG version
const updated = src.replace(oldBlock, newBlock);

if (updated === src) {
  console.error("⚠️ Replacement produced no diff. Aborting to be safe; original file left untouched.");
  process.exit(1);
}

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ Swapped circle 'A' header logo for /abando-logo.inline.png in app/embedded/page.tsx.");
