#!/usr/bin/env node
import fs from "node:fs";

const FILE = "app/embedded/page.tsx";

let src = fs.readFileSync(FILE, "utf8");

// Find the <header>…</header> block in the embedded page
const headerStart = src.indexOf("<header");
if (headerStart === -1) {
  console.error("❌ Could not find <header> in app/embedded/page.tsx. No changes made.");
  process.exit(1);
}

const closingToken = "</header>";
const headerEnd = src.indexOf(closingToken, headerStart);
if (headerEnd === -1) {
  console.error("❌ Could not find closing </header>. No changes made.");
  process.exit(1);
}

const oldHeader = src.slice(headerStart, headerEnd + closingToken.length);

// New header markup: same hero text, new “Built for Shopify” block on the right
const newHeader = `      {/* Top header row */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-10 md:gap-16">
        {/* Left: Abando logo + hero copy */}
        <div className="space-y-4 md:max-w-xl">
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
          </div>

          <div className="space-y-3">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              See how Abando turned this week&apos;s hesitations into extra orders.
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              This embedded view lines up with what shoppers actually did in your store. Instead of one big
              &quot;abandoned&quot; bucket, Abando groups sessions into hesitation types and quietly runs follow-ups
              that match how each shopper is hesitating.
            </p>
          </div>
        </div>

        {/* Right: Built for Shopify + CTA */}
        <div className="flex flex-col items-end gap-4">
          <div className="flex flex-col items-end gap-1">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Built for
            </p>
            <ShopifyBadge />
          </div>

          <button
            type="button"
            className="inline-flex items-center rounded-full border border-emerald-500/60 px-4 py-1.5 text-xs font-medium tracking-wide text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] hover:border-emerald-400 hover:text-emerald-50"
          >
            Live in your Shopify admin
          </button>
        </div>
      </header>`;

const backupPath = FILE + ".before_built_for_swap_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

const updated = src.replace(oldHeader, newHeader);

if (updated === src) {
  console.error("⚠️ Replacement produced no diff. Original file left untouched.");
  process.exit(1);
}

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ Header updated to use “Built for Shopify” block and removed old centered text.");
