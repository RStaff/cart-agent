#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const WRITE = process.env.WRITE === "1";
const repo = process.cwd();

function log(...args){ console.log(...args); }
function read(p){ try { return fs.readFileSync(p,"utf8"); } catch { return null; } }
function write(p, s){ fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); }
function prettierMaybe(files){
  if (!WRITE || !files.length) return;
  try { execSync(`npx --yes prettier -w ${files.map(f=>JSON.stringify(f)).join(" ")}`, { stdio: "ignore" }); } catch {}
}

function componentSource(){
  const L = [];
  L.push('"use client";');
  L.push('import React from "react";');
  L.push('');
  L.push('type Layout = "inline" | "block";');
  L.push('export type InstallCTAProps = {');
  L.push('  className?: string;');
  L.push('  layout?: Layout;');
  L.push('  sticky?: boolean;');
  L.push('  compact?: boolean;');
  L.push('  onlyOn?: string[]; // optional: render only on these routes');
  L.push('};');
  L.push('');
  L.push('export default function InstallCTA({');
  L.push('  className = "",');
  L.push('  layout = "inline",');
  L.push('  sticky = false,');
  L.push('  compact = false,');
  L.push('  onlyOn = [],');
  L.push('}: InstallCTAProps) {');
  L.push('  // route gating (safe on server/client)');
  L.push('  if (Array.isArray(onlyOn) && onlyOn.length) {');
  L.push('    try {');
  L.push('      const href = typeof window !== "undefined" ? window.location.pathname : "/";');
  L.push('      const ok = onlyOn.some((p) => href === p || href.startsWith(p));');
  L.push('      if (!ok) return null;');
  L.push('    } catch {}');
  L.push('  }');
  L.push('');
  L.push('  const root = "install-cta";');
  L.push('  const wrap = layout === "block" ? "flex flex-col items-start gap-2" : "flex items-center gap-3";');
  L.push('  const stickyCls = sticky ? "sticky bottom-4 bg-white/70 dark:bg-black/40 backdrop-blur" : "";');
  L.push('  const cls = [root + " " + wrap + " " + stickyCls, className].filter(Boolean).join(" ");');
  L.push('');
  L.push('  return (');
  L.push('    <div className={cls}>');
  L.push('      <button');
  L.push('        type="button"');
  L.push('        className="px-3 py-2 rounded bg-black text-white hover:opacity-90"');
  L.push('        onClick={() => { try { window.location.assign("/install"); } catch {} }}');
  L.push('      >');
  L.push('        Install');
  L.push('      </button>');
  L.push('      {!compact && (');
  L.push('        <span className="text-sm text-neutral-600 dark:text-neutral-300">');
  L.push('          Add the Abando widget to your store in one click.');
  L.push('        </span>');
  L.push('      )}');
  L.push('    </div>');
  L.push('  );');
  L.push('}');
  L.push('');
  return L.join("\n");
}

function ensureComponent(){
  const out = path.join(repo, "src", "components", "InstallCTA.tsx");
  const want = componentSource();
  const have = read(out);
  if (have !== want) {
    if (WRITE) write(out, want);
    return { updated: true, path: out };
  }
  return { updated: false, path: out };
}

function wireLayout(){
  const p = path.join(repo, "src", "app", "layout.tsx");
  const src = read(p);
  if (!src) return { changed: false, path: p, reason: "missing layout.tsx" };

  let next = src;

  // Import (prefer alias path)
  if (!/from\s+["']@\/components\/InstallCTA["']/.test(next)) {
    const importLine = 'import InstallCTA from "@/components/InstallCTA";\n';
    const headImportBlock = /^(import[\s\S]*?\n)(?!import)/m;
    if (headImportBlock.test(next)) {
      next = next.replace(headImportBlock, (m) => m + importLine);
    } else if (/^import .+/m.test(next)) {
      next = next.replace(/^(import .+\n)+/m, (m) => m + importLine);
    } else {
      next = importLine + next;
    }
  }

  // Usage before </body>
  if (!/<InstallCTA\b/.test(next)) {
    next = next.replace(/<\/body>/, (m) => `        {/* Global Install CTA */}\n        <InstallCTA />\n${m}`);
  }

  if (next !== src) {
    if (WRITE) write(p, next);
    return { changed: true, path: p };
  }
  return { changed: false, path: p };
}

(function main(){
  log(`→ repo: ${repo}`);
  log(WRITE ? "WRITE mode" : "DRY-RUN mode");
  const c = ensureComponent();
  const w = wireLayout();
  if (WRITE) prettierMaybe([c.path, w.path].filter(Boolean));
  log("✓ Added/updated InstallCTA component and wired it into layout.tsx");
})();
