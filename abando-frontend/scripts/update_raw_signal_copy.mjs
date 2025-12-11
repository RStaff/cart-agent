#!/usr/bin/env node
import fs from "fs";

const file = "app/demo/playground/page.tsx";
let text = fs.readFileSync(file, "utf8");

console.log("🔧 Updating raw-signal → value copy in /demo/playground…");

// Match the whole "How Abando interprets it" copy block:
// from the h3 with "How Abando interprets it" through the paragraph that
// starts with "Each pattern maps to a small set of plays".
const blockRegex =
  /<h3[^>]*>\s*5\s*·\s*How Abando interprets it\s*<\/h3>[\s\S]*?<p[^>]*>\s*Each pattern maps to a small set of plays[\s\S]*?<\/p>/;

if (!blockRegex.test(text)) {
  console.log("⚠️ Could not find the existing interpretation block. No changes made.");
  process.exit(0);
}

const replacement = `
<h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
  5 · How Abando interprets it
</h3>
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

text = text.replace(blockRegex, replacement);

fs.writeFileSync(file, text, "utf8");
console.log("✅ Updated raw-signal → value section in demo playground.");
