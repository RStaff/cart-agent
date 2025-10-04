import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const repo = process.cwd();
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) files.push(p);
  }
}
walk(path.join(repo, "src"));

const imgHits = [];
const nextImageHits = [];
const unusedDisableHits = [];

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  if (/\<img\b/i.test(s)) {
    const hasNextImageImport = /from\s+["']next\/image["']/.test(s);
    const simpleImgPattern =
      /<img\s+[^>]*\bsrc=["'][^"']+["'][^>]*\balt=["'][^"']*["'][^>]*>/i;
    const simple = simpleImgPattern.test(s);
    imgHits.push({
      file: path.relative(repo, f),
      hasNextImageImport,
      simpleMigratable: simple,
    });
  }
  if (/eslint-disable\b/.test(s)) {
    // catch unused "no-console" disables (what ESLint flagged for you)
    if (/eslint-disable[^*\n]*\bno-console\b/.test(s)) {
      unusedDisableHits.push(path.relative(repo, f));
    }
  }
}

let lintWarns = "";
try {
  lintWarns = execSync(
    "npm run -s lint -- --max-warnings=1000 --format json",
    { stdio: "pipe" }
  ).toString();
} catch (e) {
  // if lint fails due to errors, we still parse what we got
  lintWarns = e.stdout?.toString() || "";
}

let parsed = [];
try { parsed = JSON.parse(lintWarns); } catch {}
const nextRule = "@next/next/no-img-element";
const nextRuleFiles = new Set();
for (const r of parsed) {
  for (const m of r.messages || []) {
    if (m.ruleId === nextRule) nextRuleFiles.add(path.relative(repo, r.filePath));
  }
}

// Report
console.log("── Diagnosis");
console.log("Policy: --max-warnings=0 (warnings fail the lint step)\n");

console.log("Files with <img>:");
if (imgHits.length === 0) {
  console.log("  (none)");
} else {
  for (const h of imgHits) {
    const flagged = nextRuleFiles.has(h.file) ? " [rule firing]" : "";
    console.log(
      `  - ${h.file}${flagged} | next/image import: ${h.hasNextImageImport ? "yes" : "no"} | migratable: ${h.simpleMigratable ? "likely" : "needs review"}`
    );
  }
}
console.log("");

console.log("Unused eslint-disable candidates (no-console):");
if (unusedDisableHits.length === 0) console.log("  (none)");
else for (const f of unusedDisableHits) console.log("  - " + f);

console.log("\nRecommendation:");
if (imgHits.some(h => h.simpleMigratable)) {
  console.log("  • Prefer migrating the simple <img> cases to next/image (root fix).");
}
if (Array.from(nextRuleFiles).length) {
  console.log("  • For non-migratable cases, add a config-level allowlist (root config), not per-file disables.");
}
if (unusedDisableHits.length) {
  console.log("  • Remove unused eslint-disable directives (true cleanup).");
}
console.log("\n(no files were modified)");
