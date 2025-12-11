#!/usr/bin/env node
/**
 * add_abando_response_block_v1.mjs
 *
 * Adds an "Abando response & why" block inside the embedded
 * Highlight of the Day card, just above the existing footnote:
 * "In a live account, these follow-ups reflect..."
 */

import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "app/embedded/page.tsx");

if (!fs.existsSync(FILE)) {
  console.error("❌ Cannot find app/embedded/page.tsx");
  process.exit(1);
}

const original = fs.readFileSync(FILE, "utf8");

// Quick sanity check so we only touch the expected version
if (!original.includes("HIGHLIGHT OF THE DAY") || !original.includes("In a live account, these follow-ups reflect")) {
  console.error("⚠️ Embedded page does not look like the expected v2 layout. Aborting to be safe.");
  process.exit(1);
}

// Regex to grab the footnote paragraph at the bottom of the Highlight card
const footnoteRegex = new RegExp(
  String.raw`(<p className="mt-4 text-$begin:math:display$0\\\.7rem$end:math:display$ text-slate-400">[\s\S]*?these follow-ups reflect the real mix of email, SMS, and onsite nudges Abando is running against this pattern in your store\.[\s\S]*?</p>)`
);

const match = original.match(footnoteRegex);

if (!match) {
  console.error("⚠️ Could not locate the Highlight footnote paragraph. Aborting.");
  process.exit(1);
}

const footnoteBlock = match[1];

const injection = `
                  {/* Abando response & why */}
                  <div className="mt-6 border-t border-emerald-500/20 pt-4">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                      Abando response &amp; why
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      Abando's AI reads this hesitation pattern and quietly picks the lowest-friction nudge—choosing channel, timing, and tone so you recover the order without blasting bigger discounts.
                    </p>
                  </div>

                  ${footnoteBlock}
`;

// Backup then write
const backupPath = FILE + ".before_abando_response_block_v1_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, original, "utf8");

const updated = original.replace(footnoteBlock, injection);

if (updated === original) {
  console.error("⚠️ Replacement produced no change. Aborting to be safe.");
  process.exit(1);
}

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ 'Abando response & why' block injected above the Highlight footnote.");
