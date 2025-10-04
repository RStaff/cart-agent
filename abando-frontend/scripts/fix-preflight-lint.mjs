import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const repo = process.cwd();
const filesToClean = [
  "src/app/dashboard/page.tsx",
  "src/app/pricing/page.tsx",
];
const nameMap = {
  "src/app/dashboard/page.tsx": ["DashboardExplainer"],
  "src/app/pricing/page.tsx": ["PricingExplainer"],
};

function read(p){ try { return fs.readFileSync(p,"utf8"); } catch { return null; } }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }

function removeUnusedImports(src, names){
  let out = src;
  for (const n of names) {
    // Remove default-import lines like: import DashboardExplainer from "...";
    const reDefault = new RegExp(
      String.raw`^\s*import\s+${n}\s*(?:,|\s*from\s*['"][^'"]+['"])\s*;\s*$`,
      "m"
    );
    out = out.replace(reDefault, "");

    // Remove named-import occurrences like: import { ..., DashboardExplainer, ... } from "...";
    const reNamed = new RegExp(
      String.raw`^\s*import\s*\{[^}]*\b${n}\b[^}]*\}\s*from\s*['"][^'"]+['"]\s*;\s*$`,
      "m"
    );
    out = out.replace(reNamed, (line) => {
      // If named import includes multiple names, drop just the name.
      const inner = line.replace(/^\s*import\s*\{([\s\S]*)\}\s*from([\s\S]*)$/m, "$1");
      const rest = line.replace(/^\s*import\s*\{[\s\S]*\}\s*from([\s\S]*)$/m, "$1");
      const cleanedInner = inner
        .split(",")
        .map(s => s.trim())
        .filter(s => s && s.split(/\s+as\s+/)[0] !== n)
        .join(", ");
      if (!cleanedInner) return ""; // whole line becomes empty if no names left
      return `import { ${cleanedInner} } from${rest}`;
    });

    // Also handle "type" named imports
    const reTypeNamed = new RegExp(
      String.raw`^\s*import\s+type\s*\{[^}]*\b${n}\b[^}]*\}\s*from\s*['"][^'"]+['"]\s*;\s*$`,
      "m"
    );
    out = out.replace(reTypeNamed, (line) => {
      const inner = line.replace(/^\s*import\s+type\s*\{([\s\S]*?)\}\s*from([\s\S]*)$/m, "$1");
      const rest = line.replace(/^\s*import\s+type\s*\{[\s\S]*?\}\s*from([\s\S]*)$/m, "$1");
      const cleanedInner = inner
        .split(",")
        .map(s => s.trim())
        .filter(s => s && s.split(/\s+as\s+/)[0] !== n)
        .join(", ");
      if (!cleanedInner) return ""; 
      return `import type { ${cleanedInner} } from${rest}`;
    });
  }
  // Collapse extra blank lines introduced by deletions
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}

function stripUnusedEslintDisableLine(filePath){
  const src = read(filePath);
  if (!src) return false;
  const next = src.replace(/^\s*\/\*\s*eslint-disable[^\n]*\n/m, "");
  if (next !== src) { write(filePath, next); return true; }
  return false;
}

let changed = [];
for (const rel of filesToClean) {
  const abs = path.join(repo, rel);
  const src = read(abs);
  if (!src) continue;
  const next = removeUnusedImports(src, nameMap[rel] || []);
  if (next !== src) { write(abs, next); changed.push(abs); }
}

// Clean the unused eslint-disable line in ensure-cta-pages.mjs (warning only)
const ensureCtaRel = "scripts/ensure-cta-pages.mjs";
const ensureCtaAbs = path.join(repo, ensureCtaRel);
if (stripUnusedEslintDisableLine(ensureCtaAbs)) changed.push(ensureCtaAbs);

// Prettier (best effort)
if (changed.length) {
  try {
    execSync(`npx --yes prettier -w ${changed.map(f => JSON.stringify(f)).join(" ")}`, { stdio: "ignore" });
  } catch {}
}

console.log(changed.length ? `Patched files:\n - ${changed.map(p=>path.relative(repo,p)).join("\n - ")}` : "No changes needed.");
// Re-run lint blocking so caller sees the result
try {
  execSync(`npm run -s lint -- --max-warnings=0`, { stdio: "inherit" });
} catch {
  process.exit(1);
}
