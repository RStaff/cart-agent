import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "app/embedded/page.tsx");

let src = fs.readFileSync(FILE, "utf8");
let updated = src;

// -----------------------------
// 1) Remove "Embedded in Shopify admin" span
// -----------------------------
const embeddedSpan = `<span className="uppercase tracking-[0.24em] text-slate-500">Embedded in Shopify admin</span>`;

if (updated.includes(embeddedSpan)) {
  updated = updated.replace(embeddedSpan, "");
  console.log("✅ Removed \"Embedded in Shopify admin\" span.");
} else {
  console.warn("⚠️ Could not find embedded span; text may already be changed.");
}

// -----------------------------
// 2) Swap wide wordmark logo → rounded app icon block
// -----------------------------
const oldLogoBlock = `<div className="relative h-9 w-32">
            <Image
              alt="Abando logo"
              src="/abando-logo.inline.png"
              fill
              className="object-contain"
            />
          </div>`;

const newLogoBlock = `<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/40 bg-slate-900/80 shadow-[0_0_0_1px_rgba(16,185,129,0.45)]">
            <Image
              alt="Abando app icon"
              src="/abando-app-icon.svg"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>`;

if (updated.includes(oldLogoBlock)) {
  updated = updated.replace(oldLogoBlock, newLogoBlock);
  console.log("✅ Replaced wide Abando wordmark with rounded app icon tile.");
} else {
  console.warn("⚠️ Could not find old logo block. Skipped logo swap.");
}

// -----------------------------
// 3) Write changes if anything actually changed
// -----------------------------
if (updated === src) {
  console.error("❌ No changes detected. Original file left untouched.");
  process.exit(1);
}

const backupPath = FILE + ".before_final_header_cleanup_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");
fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("🎯 Embedded header cleaned: no 'Embedded in Shopify admin', new icon tile.");
