#!/usr/bin/env node
import fs from "fs";
import path from "path";

const FILE = path.join("app", "embedded", "page.tsx");

// Read current file
const src = fs.readFileSync(FILE, "utf8");

// This is the current header logo block (circle with "A")
const marker =
  '<div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">';

const markerIndex = src.indexOf(marker);

if (markerIndex === -1) {
  console.error(
    "⚠️ Could not find the existing circle 'A' logo block in app/embedded/page.tsx. Aborting with NO changes."
  );
  process.exit(1);
}

// Grab that whole <div>…</div> block
const closingToken = "</div>";
const closingIndex = src.indexOf(closingToken, markerIndex);
if (closingIndex === -1) {
  console.error("⚠️ Could not find closing </div> for the logo block. Aborting.");
  process.exit(1);
}

const oldBlock = src.slice(markerIndex, closingIndex + closingToken.length);

// New logo block using your inline PNG
const newBlock = `      <div className="relative h-9 w-32">
        <Image
          src="/abando-logo.inline.png"
          alt="Abando logo"
          fill
          className="object-contain"
          priority
        />
      </div>`;

// Backup then write
const backupPath = FILE + ".before_logo_swap_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

const updated = src.replace(oldBlock, newBlock);

if (updated === src) {
  console.error("⚠️ Replacement produced no diff. Aborting to be safe.");
  process.exit(1);
}

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log(
  "✅ Replaced circle 'A' header with inline Abando logo PNG (/abando-logo.inline.png)."
);
