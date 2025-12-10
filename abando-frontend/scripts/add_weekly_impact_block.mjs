import fs from "fs";
import path from "path";

const filePath = path.join(
  process.cwd(),
  "app",
  "demo",
  "playground",
  "page.tsx"
);

console.log("🔧 Adding weekly impact block under the 7-day snapshot…");

let text = fs.readFileSync(filePath, "utf8");

// 1) Find the "7-day recovered orders snapshot" heading
const headingMarker = "7-day recovered orders snapshot";
const headingIndex = text.indexOf(headingMarker);

if (headingIndex === -1) {
  console.log("⚠️ Could not find the 7-day snapshot heading. No changes made.");
  process.exit(0);
}

// 2) Find the first <p ...> AFTER that heading (the description paragraph)
const firstPIndex = text.indexOf("<p", headingIndex);
if (firstPIndex === -1) {
  console.log("⚠️ Found the heading but no <p> after it. No changes made.");
  process.exit(0);
}

const closePIndex = text.indexOf("</p>", firstPIndex);
if (closePIndex === -1) {
  console.log("⚠️ Found the description <p> but no closing </p>. No changes made.");
  process.exit(0);
}

// 3) Build the weekly impact block to inject
const weeklyImpactBlock = `
<div className="mt-6 rounded-3xl border border-emerald-500/40 bg-emerald-950/10 px-6 py-5 text-sm text-emerald-50 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
    This week at a glance
  </p>
  <p className="mt-2 text-sm">
    Abando quietly rescued <span className="font-semibold">$5,040</span> in revenue that would have vanished.
  </p>
  <p className="mt-1 text-xs text-emerald-200/80">
    That’s roughly <span className="font-semibold">200 extra outfits</span> this month at this pace—without bigger discounts or more ad spend.
  </p>
</div>
`;

// 4) Inject block *after* the description paragraph
const injectionPoint = closePIndex + "</p>".length;

const before = text.slice(0, injectionPoint);
const after  = text.slice(injectionPoint);

const newText = before + weeklyImpactBlock + after;

// 5) Backup then write
const backupPath = filePath.replace(
  /page\.tsx$/,
  `page.tsx.before_weekly_impact_${Date.now()}.tsx`
);
fs.writeFileSync(backupPath, text, "utf8");

fs.writeFileSync(filePath, newText, "utf8");
console.log("✅ Added weekly impact block under the 7-day snapshot.");
