import fs from "node:fs";
import path from "node:path";

const file = path.join("app", "demo", "playground", "page.tsx");
let text = fs.readFileSync(file, "utf8");

console.log("🔧 Normalizing /demo/playground UI…");

/**
 * 1) Kill any BrandLogo import/usage and go back to the safe logo <Image>.
 */

text = text.replace(
  /import\s*{?\s*BrandLogo\s*}?\s*from\s*["']@\/components\/BrandLogo["'];?\n?/,
  ""
);

// If BrandLogo is used anywhere, replace it with the logo Image block.
if (text.includes("<BrandLogo")) {
  const logoBlock = [
    `<Image`,
    `  src="/abando-logo.png"`,
    `  alt="Abando"`,
    `  width={32}`,
    `  height={30}`,
    `  priority`,
    `/>`,
  ].join("\n              ");

  text = text.replace(/<BrandLogo[^>]*\/>/g, logoBlock);
}

/**
 * 2) Improve card hover styling:
 *    - Find any className that contains both 'rounded-3xl' and 'border'
 *    - If it doesn't already have hover:-translate-y-1, add our hover + glow
 */

text = text.replace(
  /className="([^"]*rounded-3xl[^"]*border[^"]*)"/g,
  (match, classes) => {
    if (classes.includes("hover:-translate-y-1")) {
      // already upgraded
      return match;
    }

    const extra =
      " bg-slate-900/40 border-slate-800/80 p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20";

    return `className="${classes}${extra}"`;
  }
);

/**
 * 3) Loosen spacing above the 7-day snapshot section.
 *    If we find a block with '7-day recovered orders snapshot', bump its margin.
 */

text = text.replace(
  /className="mt-8 space-y-6">([\s\S]*?7-day recovered orders snapshot)/,
  'className="mt-12 space-y-8">$1'
);

fs.writeFileSync(file, text, "utf8");
console.log("✅ demo/playground UI normalized (logo, cards, spacing).");
