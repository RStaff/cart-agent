import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "app/demo/playground/page.tsx");

console.log("🔧 Rewriting raw-signal → value section in /demo/playground…");

let text = fs.readFileSync(file, "utf8");

// We support both casing variants of the heading
const headingVariants = [
  '<h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">5 · How Abando interprets it</h3>',
  '<h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">5 · HOW ABANDO INTERPRETS IT</h3>',
];

let heading = null;
let start = -1;

for (const h of headingVariants) {
  const idx = text.indexOf(h);
  if (idx !== -1) {
    heading = h;
    start = idx;
    break;
  }
}

if (start === -1 || !heading) {
  console.log("⚠️ Could not find the interpretation heading. No changes made.");
  process.exit(0);
}

// Find the end of the section that contains this heading
const end = text.indexOf("</section>", start);
if (end === -1) {
  console.log("⚠️ Could not find closing </section> after the heading. No changes made.");
  process.exit(0);
}

const before = text.slice(0, start);
const after = text.slice(end); // includes </section> and everything after

const replacementInner = `
${heading}
<h2 className="mt-3 text-lg font-semibold text-slate-50">
  A few clear insights instead of raw logs
</h2>
<p className="mt-4 text-sm leading-relaxed text-slate-300">
  Abando turns noisy clickstream data into a short list of stories about what&apos;s
  really happening in your carts. Instead of digging through event logs, your team
  sees plain-language insights like:
</p>
<ul className="mt-4 space-y-2 text-sm text-slate-300">
  <li>• 38% of abandons happened right after shoppers checked the returns policy.</li>
  <li>• 24% abandoned after comparing 3+ outfits side by side.</li>
  <li>• 18% abandoned while building full outfits and never quite hitting &quot;Buy.&quot;</li>
</ul>
<p className="mt-4 text-sm leading-relaxed text-slate-300">
  Each of these becomes a pattern Abando tracks over time — with the number of
  orders at stake, the best-performing plays (emails, SMS, onsite nudges), and the
  recovered revenue tied to each one. Raw events turn directly into a small set of
  actions and a concrete lift number, not another dashboard to decipher.
</p>
`.trim();

const newText = before + replacementInner + after;

fs.writeFileSync(file, newText, "utf8");
console.log("✅ Updated raw-signal → value section in demo playground.");
