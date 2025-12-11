#!/usr/bin/env node
import fs from "fs";

const FILE = "app/embedded/page.tsx";
const src = fs.readFileSync(FILE, "utf8");

// We will replace the entire <header>...</header> block that follows
// the "Top header row" comment.
const commentToken = "{/* Top header row */}";
const commentIndex = src.indexOf(commentToken);

if (commentIndex === -1) {
  console.error("⚠️ Could not find 'Top header row' comment in app/embedded/page.tsx. Aborting.");
  process.exit(1);
}

const headerStart = src.indexOf("<header", commentIndex);
if (headerStart === -1) {
  console.error("⚠️ Could not find <header> tag after 'Top header row' comment. Aborting.");
  process.exit(1);
}

const headerEndToken = "</header>";
const headerEnd = src.indexOf(headerEndToken, headerStart);
if (headerEnd === -1) {
  console.error("⚠️ Could not find closing </header> tag. Aborting.");
  process.exit(1);
}

// old header block we will replace
const oldHeader = src.slice(headerStart, headerEnd + headerEndToken.length);

// new header block: logo on the left, tag line next to it,
// H1 + intro text under that, Shopify badge + button on the right.
// This keeps your layout tight and puts the logo exactly where you expect.
const newHeader = `      <header className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        {/* Left side: logo + title + intro */}
        <div className="flex flex-col gap-4">
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
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
              Abando dashboard · Live view of recovered orders &amp; shopper patterns
            </p>
          </div>

          <div className="space-y-3">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              See how Abando turned this week's hesitations into extra orders.
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              This embedded view lines up with what shoppers actually did in your store.
              Instead of one big &quot;abandoned&quot; bucket, Abando groups sessions into
              a few hesitation patterns and quietly runs follow-ups that match how each
              shopper is hesitating.
            </p>
          </div>
        </div>

        {/* Right side: Shopify badge + CTA */}
        <div className="flex flex-col items-end gap-3 text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Embedded in Shopify admin
          </p>
          <div className="flex items-center gap-3">
            <ShopifyBadge variant="embedded" />
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-emerald-500/60 px-4 py-2 text-xs font-semibold text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.3)] hover:bg-emerald-500/10"
            >
              • Live in your Shopify admin
            </button>
          </div>
        </div>
      </header>`;

const backupPath = FILE + ".before_header_overwrite_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

const updated = src.replace(oldHeader, newHeader);

if (updated === src) {
  console.error("⚠️ Replacement produced no diff. Original file left untouched.");
  process.exit(1);
}

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ Overwrote embedded <header> with clean Abando logo + aligned heading layout.");
