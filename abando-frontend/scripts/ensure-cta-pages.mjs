#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const repo = process.cwd();
const WRITE = process.env.WRITE === "1";
const TARGETS = [
  "src/app/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/demo/playground/page.tsx",
];

function read(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}
function write(p, s) {
  if (!WRITE) return false;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, "utf8");
  return true;
}
function relImport(fromFile, toFileAbs) {
  const fromDir = path.dirname(fromFile);
  const rel = path
    .relative(fromDir, toFileAbs)
    .replace(/\\/g, "/")
    .replace(/\.tsx?$/, "");
  return rel.startsWith(".") ? rel : `./${rel}`;
}
function addImportOnce(src, importPath) {
  if (new RegExp(`from\\s+['"]${importPath}['"]`).test(src)) return src;
  if (/\bInstallCTA\b/.test(src)) return src;
  const line = `\nimport InstallCTA from "${importPath}";\n`;
  const m = src.match(/^(?:import[\s\S]*?;\s*)+/);
  return m
    ? src.slice(0, m[0].length) + line + src.slice(m[0].length)
    : line + src;
}
function insertCTAUsage(src) {
  if (/<InstallCTA\b/.test(src)) return src;
  const snippet = `\n  {/* Install CTA */}\n  <InstallCTA className="mt-6" layout="inline" />\n`;
  const openers = [/<main[\s\S]*?>/, /<Section[\s\S]*?>/, /<section[\s\S]*?>/];
  for (const re of openers) {
    if (re.test(src)) return src.replace(re, (t) => t + snippet);
  }
  const closers = [/<\/main>/, /<\/Section>/, /<\/section>/];
  for (const re of closers) {
    if (re.test(src)) return src.replace(re, snippet + "\n$&");
  }
  return src; // could not find safe spot; no-op
}
function ensureCTAOnPage(rel) {
  const abs = path.join(repo, rel);
  const src = read(abs);
  if (!src) return { rel, status: "skip (missing)" };
  const importPath = relImport(
    abs,
    path.join(repo, "src/components/InstallCTA.tsx"),
  );
  let next = addImportOnce(src, importPath);
  next = insertCTAUsage(next);
  if (next === src) return { rel, status: "ok (no change)" };
  write(abs, next);
  return { rel, status: WRITE ? "wrote" : "would-change" };
}
(function main() {
  console.log(`→ repo: ${repo}`);
  console.log(WRITE ? "WRITE mode" : "DRY-RUN");

  try {
    execSync("node scripts/add-install-cta.mjs", { stdio: "inherit" });
  } catch {}

  const results = TARGETS.map(ensureCTAOnPage);

  if (WRITE) {
    const changed = results
      .filter((r) => r.status === "wrote")
      .map((r) => r.rel);
    if (changed.length) {
      try {
        execSync(
          `npx --yes prettier -w ${changed.map((f) => JSON.stringify(f)).join(" ")}`,
          { stdio: "ignore" },
        );
      } catch {}
    }
  }

  console.log("\nSummary:");
  for (const r of results) console.log(`  ${r.status.padEnd(14)} ${r.rel}`);
  if (!WRITE)
    console.log(
      "\nDRY-RUN complete. To apply: WRITE=1 node scripts/ensure-cta-pages.mjs",
    );
})();
