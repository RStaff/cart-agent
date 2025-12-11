#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("app/embedded/page.tsx");

// 1) Read file
let src = fs.readFileSync(FILE, "utf8");

// 2) Find the <header>...</header> block
const startToken = "<header";
const endToken = "</header>";

const startIndex = src.indexOf(startToken);
if (startIndex === -1) {
  console.error("❌ Could not find <header> in app/embedded/page.tsx");
  process.exit(1);
}

const endIndex = src.indexOf(endToken, startIndex);
if (endIndex === -1) {
  console.error("❌ Could not find </header> for embedded header.");
  process.exit(1);
}

const headerEndIndex = endIndex + endToken.length;

// 3) New clean header markup
const newHeader = `  <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-10 md:gap-16">
    {/* Left: logo + title */}
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Image
          src="/abando-logo.inline.png"
          alt="Abando logo"
          width={40}
          height={40}
          className="object-contain"
          priority
        />
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
          Abando dashboard · Live view of recovered orders & shopper patterns
        </p>
      </div>

      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
        See how Abando turned this week's hesitations into extra orders.
      </h1>

      <p className="max-w-2xl text-sm text-slate-300">
        This embedded view lines up with what shoppers actually did in your store. Instead of one big "abandoned" bucket,
        Abando groups sessions into hesitation types and quietly runs follow-ups that match how each shopper is hesitating.
      </p>
    </div>

    {/* Right: Shopify badge + CTA */}
    <div className="mt-6 flex flex-col items-start gap-3 md:items-end md:mt-0">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
        Embedded in Shopify admin
      </p>
      <div className="flex items-center gap-3">
        <ShopifyBadge variant="embedded" />
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-emerald-500/60 px-4 py-1.5 text-xs font-medium tracking-wide text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] hover:border-emerald-400 hover:text-emerald-50"
        >
          Live in your Shopify admin
        </button>
      </div>
    </div>
  </header>`;

// 4) Backup and write
const backupPath = FILE + ".before_header_normalize_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

src = src.slice(0, startIndex) + newHeader + src.slice(headerEndIndex);
fs.writeFileSync(FILE, src, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ Embedded header replaced with clean Abando layout (logo + heading + Shopify panel).");
