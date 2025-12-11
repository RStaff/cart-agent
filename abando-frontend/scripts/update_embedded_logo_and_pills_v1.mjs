#!/usr/bin/env node
import fs from "fs";

const FILE = "app/embedded/page.tsx";

if (!fs.existsSync(FILE)) {
  console.error("❌ Could not find", FILE);
  process.exit(1);
}

const src = fs.readFileSync(FILE, "utf8");
let updated = src;

// -----------------------------
// 1) Swap the plain logo for a framed, glowing tile
// -----------------------------
const beforeLogoBlock = `
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-32">
              <Image
                src="/abando-logo.inline.png"
                alt="Abando logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-emerald-400/80">
              Abando dashboard · Live view of recovered orders &amp; shopper patterns
            </p>
          </div>`;

const afterLogoBlock = `
          <div className="flex items-center gap-4">
            {/* Abando app tile */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/40 bg-slate-900/80 shadow-[0_0_30px_rgba(16,185,129,0.55)]">
              <div className="relative h-6 w-6">
                <Image
                  src="/abando-logo.inline.png"
                  alt="Abando logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Label text */}
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-emerald-400/80">
              Abando dashboard · Live view of recovered orders &amp; shopper patterns
            </p>
          </div>`;

if (updated.includes(beforeLogoBlock)) {
  updated = updated.replace(beforeLogoBlock, afterLogoBlock);
  console.log("✅ Replaced header logo with framed Abando tile.");
} else {
  console.warn("⚠️ Header logo block pattern not found; skipping logo swap.");
}

// -----------------------------
// 2) Make weekly impact pills glow + hover
// -----------------------------
const beforePills = `
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    activeDay === dayKey
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                      : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-100"
                  )`;

const afterPills = `
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors transition-shadow",
                    activeDay === dayKey
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.55)]"
                      : "border-slate-700/80 bg-slate-900/60 text-slate-300 hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-100 hover:shadow-[0_0_16px_rgba(16,185,129,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  )`;

if (updated.includes(beforePills)) {
  updated = updated.replace(beforePills, afterPills);
  console.log("✅ Updated weekly impact pills for glow + hover.");
} else {
  console.warn("⚠️ Weekly pill class pattern not found; skipping pill tweak.");
}

// -----------------------------
// 3) Write changes if anything actually changed
// -----------------------------
if (updated === src) {
  console.error("❌ No changes detected. Original file left untouched.");
  process.exit(1);
}

const backupPath = FILE + ".before_logo_and_pills_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");
fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("🎯 Embedded header + weekly pills updated.");
