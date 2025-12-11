import fs from "fs";

const FILE = "app/embedded/page.tsx";

// This exact sentence should already exist at the bottom of the Highlight card.
const FOOTNOTE =
  "In a live account, these follow-ups reflect the real mix of email, SMS, and onsite nudges Abando is running against this pattern in your store.";

const src = fs.readFileSync(FILE, "utf8");
const idx = src.indexOf(FOOTNOTE);

if (idx === -1) {
  console.error("⚠️ Could not find the Highlight footnote text in app/embedded/page.tsx.");
  console.error("   Make sure you're on the embedded v2 layout, then rerun.");
  process.exit(1);
}

// We'll inject just *before* the footnote text.
const before = src.slice(0, idx);
const after = src.slice(idx);

const injection = `
                  <div className="mt-6 border-t border-emerald-500/20 pt-4">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                      Abando response &amp; why
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      Abando's AI reads this hesitation pattern and quietly picks the lowest-friction nudge—choosing channel, timing, and tone so you recover the order without blasting heavier discounts.
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Behind the scenes, Abando blends email, SMS, and onsite cues based on what similar shoppers have historically responded to—so each follow-up feels natural, not noisy.
                    </p>
                  </div>

`;

// Backup then write
const backupPath = FILE + ".before_abando_response_loose_v2_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

fs.writeFileSync(FILE, before + injection + after, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ 'Abando response & why' block injected above the Highlight footnote.");
