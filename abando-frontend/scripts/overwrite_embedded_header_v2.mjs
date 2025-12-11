import fs from "node:fs";

const FILE = "app/embedded/page.tsx";

// Read current file
const src = fs.readFileSync(FILE, "utf8");

// Find the first <header>...</header> block in the file
const headerStart = src.indexOf("<header");
if (headerStart === -1) {
  console.error("❌ Could not find any <header> tag in app/embedded/page.tsx. No changes made.");
  process.exit(1);
}

const headerCloseToken = "</header>";
const headerEnd = src.indexOf(headerCloseToken, headerStart);
if (headerEnd === -1) {
  console.error("❌ Found <header> but no closing </header>. Aborting.");
  process.exit(1);
}

// This is the new, clean header we want.
// It assumes you already have:
//   import Image from "next/image";
//   import ShopifyBadge from "@/components/ShopifyBadge";
const newHeader = `      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative h-9 w-32">
            <Image
              src="/abando-logo.inline.png"
              alt="Abando logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
              Abando dashboard · Live view of recovered orders & shopper patterns
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              See how Abando turned this week's hesitations into extra orders.
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              This embedded view lines up with what shoppers actually did in your store. Instead of one big "abandoned" bucket, Abando groups sessions into hesitation types and quietly runs follow-ups that match how each shopper is hesitating.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 text-left md:items-end md:text-right">
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

// Backup original file
const backupPath = FILE + ".before_header_overwrite_v2_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

// Splice in the new header
const before = src.slice(0, headerStart);
const after = src.slice(headerEnd + headerCloseToken.length);
const updated = before + newHeader + after;

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ Embedded header replaced with clean Abando layout (single logo, aligned heading).");
