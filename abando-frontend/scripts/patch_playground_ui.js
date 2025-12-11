import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const file = path.join(repoRoot, "app", "demo", "playground", "page.tsx");

console.log("🔧 Patching demo playground UI…");

if (!fs.existsSync(file)) {
  console.error(`❌ Cannot find ${file}`);
  process.exit(1);
}

let text = fs.readFileSync(file, "utf8");

/**
 * 1) Ensure BrandLogo import exists
 *    - If the file starts with "use client"; keep that first,
 *      then inject the import immediately after.
 */
if (!text.includes("BrandLogo")) {
  const importLine = 'import { BrandLogo } from "@/components/BrandLogo";\n';

  if (text.startsWith('"use client";') || text.startsWith("'use client';")) {
    const firstNewline = text.indexOf("\n");
    text =
      text.slice(0, firstNewline + 1) +
      importLine +
      text.slice(firstNewline + 1);
    console.log("✅ Inserted BrandLogo import after 'use client';");
  } else {
    text = importLine + text;
    console.log("✅ Inserted BrandLogo import at top of file.");
  }
} else {
  console.log("ℹ️ BrandLogo import already present.");
}

/**
 * 2) Replace hero <Image ... /abando-logo-transparent.png ... />
 *    with a centered BrandLogo badge
 */
const heroRegex =
  /<Image[\s\S]*?src="\/abando-logo-transparent\.png"[\s\S]*?\/>/m;

if (heroRegex.test(text)) {
  const replacement = [
    '<div className="flex h-12 w-12 items-center justify-center rounded-2xl',
    'bg-sky-500/15 ring-1 ring-sky-500/40">',
    "  <BrandLogo width={28} height={26} />",
    "</div>",
  ].join(" ");

  text = text.replace(heroRegex, replacement);
  console.log("✅ Replaced hero logo with BrandLogo badge.");
} else {
  console.log(
    "⚠️ Could not find hero <Image ... /abando-logo-transparent.png /> to replace."
  );
}

/**
 * 3) Improve card hover formatting
 *    - Find any className containing 'rounded-3xl border'
 *    - If it doesn't already have hover:-translate-y-1, upgrade it
 */
const cardRegex = /className="([^"]*?)rounded-3xl border([^"]*?)"/g;

let cardPatches = 0;

text = text.replace(cardRegex, (match, before, after) => {
  if (match.includes("hover:-translate-y-1")) {
    return match; // already upgraded
  }

  const enhanced =
    `${before}rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 ` +
    `transition-transform duration-200 hover:-translate-y-1 ` +
    `hover:shadow-xl hover:shadow-emerald-500/20${after}`;

  cardPatches += 1;
  return `className="${enhanced}"`;
});

if (cardPatches > 0) {
  console.log(`✅ Card formatting + hover styling patched on ${cardPatches} block(s).`);
} else {
  console.log("ℹ️ No card blocks needed hover/formatting changes.");
}

fs.writeFileSync(file, text, "utf8");
console.log("🎉 patch_playground_ui.js complete.");
