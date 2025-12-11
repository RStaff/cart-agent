import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "app/demo/playground/page.tsx");

let text = fs.readFileSync(filePath, "utf8");

// 0) If we've already added it, don't double-insert
if (text.includes("Weekly impact")) {
  console.log("✅ Weekly impact block already present. No changes needed.");
  process.exit(0);
}

// 1) Backup current file
const stamp = Date.now();
const backupPath = `${filePath}.before_weekly_impact_${stamp}.tsx`;
fs.writeFileSync(backupPath, text, "utf8");
console.log("💾 Backup written to", backupPath);

// 2) Find the "7-day recovered orders snapshot" heading
const marker = "7-day recovered orders snapshot";
const markerIndex = text.indexOf(marker);

if (markerIndex === -1) {
  console.log("⚠️ Could not find the 7-day snapshot heading. No changes made.");
  process.exit(0);
}

// 3) Find the closing </p> for the paragraph after that heading
const closePIndex = text.indexOf("</p>", markerIndex);
if (closePIndex === -1) {
  console.log("⚠️ Found heading but not the closing </p>. No changes made.");
  process.exit(0);
}

// 4) Build the insert block
const insert = `
<p className="mt-3 text-sm text-emerald-300">
  Across the full week, this demo recovers just over
  <span className="font-semibold">$5,000</span> in orders that would have
  been lost — all from small, pattern-driven plays instead of blanket discounts.
</p>

<div className="mt-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 px-8 py-6 text-sm text-emerald-50 shadow-[0_0_60px_rgba(16,185,129,0.45)]">
  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300/80">
    Weekly impact
  </p>
  <p className="mt-3 text-base font-semibold">
    40+ extra orders and just over $5,000 in recovered revenue in 7 days.
  </p>
  <p className="mt-3 text-[13px] text-emerald-100/90">
    That&apos;s like adding an extra day of sales every week — without buying
    more traffic or blasting bigger coupons. In a live account, this roll-up
    ties directly to your real recovered orders.
  </p>
</div>
`;

// 5) Inject after that closing paragraph tag
const insertionPoint = closePIndex + "</p>".length;
const newText =
  text.slice(0, insertionPoint) + insert + text.slice(insertionPoint);

// 6) Write out
fs.writeFileSync(filePath, newText, "utf8");
console.log("✅ Added weekly impact block under the 7-day snapshot.");
