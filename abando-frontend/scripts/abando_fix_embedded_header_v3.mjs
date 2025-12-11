import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "app/embedded/page.tsx");

let src = fs.readFileSync(FILE, "utf8");

// 1) Fix bad ShopifyBadge import alias if present
src = src.replace(
  /from "@\/src\/components\/ShopifyBadge";/,
  'from "@/components/ShopifyBadge";'
);

// 2) Replace header block between the markers
const startMarker = "{/* Top header row */}";
const endMarker = "{/* Top stat cards */}";

const start = src.indexOf(startMarker);
const end = src.indexOf(endMarker);

if (start === -1 || end === -1 || end <= start) {
  console.error("⚠️ Could not find header markers; no changes made.");
  process.exit(1);
}

const before = src.slice(0, start + startMarker.length);
const after = src.slice(end);

const headerBlock = `
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
          </div>

          <div className="flex flex-col gap-4 md:items-end md:text-right">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
              Abando dashboard · Live view of recovered orders & shopper patterns
            </p>

            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              See how Abando turned this week's hesitations into extra orders.
            </h1>

            <p className="max-w-2xl text-sm text-slate-300">
              This embedded view lines up with what shoppers actually did in your store. Instead of
              one big "abandoned" bucket, Abando groups sessions into hesitation patterns and quietly
              runs follow-ups that match how each shopper is hesitating.
            </p>

            <div className="flex items-center justify-end gap-4">
              <ShopifyBadge variant="embedded" />
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-emerald-500/60 px-4 py-1 text-xs font-medium text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] hover:bg-emerald-500/10"
              >
                • Live in your Shopify admin
              </button>
            </div>
          </div>
        </header>

`;

const backupPath = FILE + ".before_header_v3_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, src, "utf8");

const updated = before + headerBlock + after;

fs.writeFileSync(FILE, updated, "utf8");

console.log("💾 Backed up original to:", backupPath);
console.log("✅ Wrote new embedded header with Abando logo PNG + Shopify badge.");
