#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import prettier from "prettier";

const WRITE = !!process.env.WRITE;
const repoRoot = process.cwd();

const CTA_REL = "src/components/InstallCTA.tsx";
const TARGET_PAGES = [
  "src/app/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/demo/playground/page.tsx",
];
const CTA_PROPS = { className: "mt-6", layout: "inline" };

const CTA_ABS = path.join(repoRoot, CTA_REL);

function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, "utf8"); }
async function format(code, filepath){ try{const cfg=await prettier.resolveConfig(filepath); return prettier.format(code,{...(cfg||{}), filepath});}catch{return code;}}

function parseTsx(code, filename) {
  return parser.parse(code, {
    sourceType: "module",
    sourceFilename: filename,
    plugins: ["jsx", "typescript"],
  });
}

function importSourceFor(fromAbs, toAbs) {
  const srcDir = path.join(repoRoot, "src") + path.sep;
  if (toAbs.startsWith(srcDir)) {
    const sub = toAbs.slice(srcDir.length).replace(/\.(t|j)sx?$/, "").replace(/\\/g, "/");
    return "@/" + sub;
  }
  let rel = path.relative(path.dirname(fromAbs), toAbs).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel.replace(/\.(t|j)sx?$/, "");
}

function ensureNamedImport(programPath, importedName, sourceValue) {
  // already imported?
  for (const stmt of programPath.node.body) {
    if (t.isImportDeclaration(stmt) && stmt.source.value === sourceValue) {
      const has = stmt.specifiers.some(
        s => t.isImportSpecifier(s) &&
             t.isIdentifier(s.imported, {name: importedName}) &&
             t.isIdentifier(s.local, {name: importedName})
      );
      if (has) return;
    }
  }
  const decl = t.importDeclaration(
    [t.importSpecifier(t.identifier(importedName), t.identifier(importedName))],
    t.stringLiteral(sourceValue)
  );

  // insert after "use client" if present, else after last import, else top
  let inserted = false;
  for (let i=0;i<programPath.node.body.length;i++){
    const n = programPath.node.body[i];
    if (t.isExpressionStatement(n) && t.isStringLiteral(n.expression) && n.expression.value === "use client") {
      programPath.node.body.splice(i+1, 0, decl);
      inserted = true; break;
    } else if (!t.isExpressionStatement(n)) { break; }
  }
  if (!inserted) {
    let lastImport = -1;
    programPath.node.body.forEach((n, i) => { if (t.isImportDeclaration(n)) lastImport = i; });
    if (lastImport >= 0) { programPath.node.body.splice(lastImport+1, 0, decl); inserted = true; }
  }
  if (!inserted) programPath.node.body.unshift(decl);
}

function buildInstallCTA(props) {
  const attrs = Object.entries(props).map(([k,v]) =>
    typeof v === "boolean"
      ? t.jsxAttribute(t.jsxIdentifier(k), t.jsxExpressionContainer(t.booleanLiteral(v)))
      : t.jsxAttribute(t.jsxIdentifier(k), t.stringLiteral(String(v)))
  );
  const opening = t.jsxOpeningElement(t.jsxIdentifier("InstallCTA"), attrs, true);
  return t.jsxElement(opening, null, [], true);
}

function jsxContainsInstallCTA(ast) {
  let found = false;
  traverse(ast, {
    JSXOpeningElement(p){
      if (t.isJSXIdentifier(p.node.name, {name: "InstallCTA"})) {
        found = true; p.stop();
      }
    }
  });
  return found;
}

function tryInject(programPath, el) {
  // try into <main> / <Section> / <section>
  const tryInto = (tag) => {
    let done = false;
    traverse(programPath.node, {
      JSXElement(p) {
        const op = p.node.openingElement;
        if (t.isJSXIdentifier(op.name, {name: tag})) {
          p.node.children = [t.jsxText("\n  "), el, t.jsxText("\n"), ...p.node.children];
          done = true; p.stop();
        }
      }
    }, programPath.scope, programPath.state, programPath.parentPath);
    return done;
  };
  if (tryInto("main")) return true;
  if (tryInto("Section")) return true;
  if (tryInto("section")) return true;

  // else first returned JSX
  let injected = false;
  traverse(programPath.node, {
    ReturnStatement(p) {
      const a = p.node.argument;
      if (t.isJSXElement(a)) {
        a.children = [t.jsxText("\n  "), el, t.jsxText("\n"), ...a.children];
        injected = true; p.stop();
      }
    }
  }, programPath.scope, programPath.state, programPath.parentPath);
  return injected;
}

async function ensureComponent() {
  if (exists(CTA_ABS)) { console.log(`✓ InstallCTA exists (${CTA_REL})`); return; }
  console.log(`• Creating ${CTA_REL}`);
  const code = `\
"use client";
import React from "react";

type InstallCTAProps = {
  className?: string;
  layout?: "inline" | "stacked";
  compact?: boolean;
  sticky?: boolean;
};

export function InstallCTA({
  className = "",
  layout = "inline",
  compact = false,
  sticky = false,
}: InstallCTAProps) {
  const root = "rounded-md border border-neutral-200 dark:border-neutral-800 p-3";
  const wrap = layout === "inline" ? "flex items-center gap-3" : "flex flex-col gap-3";
  const stickyCls = sticky ? "sticky bottom-4 bg-white/70 dark:bg-black/40 backdrop-blur" : "";
  return (
    <div className={[\\\`\${root} \\\${wrap} \\\${stickyCls}\\\`, className].filter(Boolean).join(" ")}>
      <button
        type="button"
        className="px-3 py-2 rounded bg-black text-white hover:opacity-90"
        onClick={() => window.open("https://chromewebstore.google.com", "_blank")}
      >
        Install{!compact && <span className="hidden sm:inline">&nbsp;for Chrome</span>}
      </button>
      <button
        type="button"
        className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700"
        onClick={() => window.open("https://apps.shopify.com", "_blank")}
      >
        Install{!compact && <span className="hidden sm:inline">&nbsp;for Shopify</span>}
      </button>
    </div>
  );
}
`;
  const formatted = await format(code, CTA_ABS);
  if (WRITE) {
    fs.mkdirSync(path.dirname(CTA_ABS), { recursive: true });
    fs.writeFileSync(CTA_ABS, formatted, "utf8");
    console.log("✓ component created");
  } else {
    console.log("↪︎ would create component (dry-run)");
  }
}

async function processFile(rel) {
  const abs = path.join(repoRoot, rel);
  if (!exists(abs)) return { rel, status: "missing" };
  let src;
  try { src = read(abs); } catch { return { rel, status: "read-error" }; }

  let ast;
  try { ast = parseTsx(src, rel); } catch (e) { return { rel, status: "parse-failed", error: String(e?.message || e) }; }

  const programPathRef = { current: null };
  traverse(ast, { Program(p){ programPathRef.current = p; } });
  if (!programPathRef.current) return { rel, status: "no-program" };

  const importSource = importSourceFor(abs, CTA_ABS);
  const before = generate(ast, { retainLines: true }).code;

  ensureNamedImport(programPathRef.current, "InstallCTA", importSource);

  let changed = generate(ast, { retainLines: true }).code !== before;

  if (!jsxContainsInstallCTA(ast)) {
    const el = buildInstallCTA(CTA_PROPS);
    const injected = tryInject(programPathRef.current, el);
    if (injected) changed = true;
  }

  if (!changed) return { rel, status: "no-op" };

  const out = generate(ast, { retainLines: true }).code;
  const formatted = await format(out, abs);
  if (WRITE) fs.writeFileSync(abs, formatted, "utf8");
  return { rel, status: WRITE ? "written" : "would-write" };
}

(async function main(){
  console.log(`→ repo: ${repoRoot}`);
  console.log(WRITE ? "WRITE mode (files will be modified)" : "DRY-RUN (no files written)");

  await ensureComponent();

  const results = [];
  for (const rel of TARGET_PAGES) {
    results.push(await processFile(rel));
  }

  console.log("\nSummary:");
  for (const r of results) {
    console.log(`  ${String(r.status).padEnd(12)} ${r.rel}${r.error ? ` (${r.error})` : ""}`);
  }
  console.log("\nDone.");
})();
