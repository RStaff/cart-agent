#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "app/embedded/page.tsx");

if (!fs.existsSync(FILE)) {
  console.error("❌ Cannot find app/embedded/page.tsx from", ROOT);
  process.exit(1);
}

const src = fs.readFileSync(FILE, "utf8");

// We replace EVERYTHING between these two markers:
const startMarker = '        {/* Top header row */}';
const endMarker   = '        {/* Top stat cards */}';

const startIndex = src.indexOf(startMarker);
const endIndex   = src.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("❌ Could not find header markers in page.tsx. No changes made.");
  process.exit(1);
}

// Slice file into: before header, header chunk, after header
const before = src.slice(0, startIndex);
const after  = src.slice(endIndex + endMarker.length);

// New header block with a single Abando logo on the left,
// cleaned up title, and Shopify badge + CTA on the right.
const newBlock = `${startMarker}
        <header className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Left: logo + title + intro copy */}
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
                Abando dashboard · Live view of recovered orders & shopper patterns
              </p>
            </div>

            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              See how Abando turned this week's hesitations into extra orders.
            </h1>

            <p className="max-w-2xl text-sm text-slate-300">
              This embedded view lines up with what shoppers actually did in your store. Instead of one
              big "abandoned" bucket, Abando groups sessions into hesitation patterns and quietly runs
              follow-ups that match how each shopper is hesitating.
            </p>
          </div>

          {/* Right: Shopify badge + CTA */}
          <div className="mt-4 flex flex-col items-end gap-3 text-right md:mt-0">
            <ShopifyBadge variant="embedded" />
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-emerald-500/60 px-4 py-1.5 text-xs font-medium tracking-wide text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] hover:border-emerald-400 hover:text-emerald-50"
            >
              Live in your Shopify admin
            </button>
          </div>
        </header>

${endMarker}`;

const backupPath = FILE + ".before_header_reset_v3_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

const updated = before + newBlock + after;

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ Embedded header reset to clean Abando layout (single logo, aligned header).");
