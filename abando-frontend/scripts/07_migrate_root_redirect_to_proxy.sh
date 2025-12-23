#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%s)"

# 1) Ensure proxy.ts exists (Next.js 16 convention)
if [ ! -f proxy.ts ]; then
  echo "⚠️ proxy.ts not found. Creating a new one..."
  cat << 'EOR' > proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Root Route Policy (Production + Local):
 * - "/" ALWAYS temporarily redirects (307) to "/demo/playground"
 * - Reason: merchants should not land on "/" during beta
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/demo/playground";
    url.search = search;
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

// Avoid running on Next internal assets
export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
EOR
  echo "✅ Created proxy.ts with root redirect policy"
else
  echo "🗂️ Backing up existing proxy.ts -> proxy.ts.bak_${STAMP}"
  cp -p proxy.ts "proxy.ts.bak_${STAMP}"

  # 2) Patch proxy.ts ONLY if our marker isn't present
  if grep -q "ABANDO_ROOT_REDIRECT_POLICY" proxy.ts; then
    echo "✅ proxy.ts already contains root redirect policy (marker found)"
  else
    echo "🔧 Patching proxy.ts to enforce root redirect policy..."

    node <<'EON'
const fs = require("fs");

const path = "proxy.ts";
let s = fs.readFileSync(path, "utf8");

const marker = "ABANDO_ROOT_REDIRECT_POLICY";
if (s.includes(marker)) {
  console.log("Marker already present; no changes.");
  process.exit(0);
}

// Best-effort: ensure imports for NextRequest/NextResponse exist
if (!s.includes('from "next/server"')) {
  s = `import { NextResponse } from "next/server";\nimport type { NextRequest } from "next/server";\n\n` + s;
}

// Insert a small helper at top-level and wrap/augment existing proxy handler
// We will:
 // 1) Add a function enforceRootRedirect(req) that returns NextResponse|null
 // 2) In export function proxy(req), call it first and return if not null
const helperBlock = `\n/** ${marker}\n * Root Route Policy:\n * - "/" ALWAYS temporarily redirects (307) to "/demo/playground"\n */\nfunction enforceRootRedirect(req: NextRequest) {\n  const { pathname, search } = req.nextUrl;\n  if (pathname === "/") {\n    const url = req.nextUrl.clone();\n    url.pathname = "/demo/playground";\n    url.search = search;\n    return NextResponse.redirect(url, 307);\n  }\n  return null;\n}\n`;

if (!s.includes("function enforceRootRedirect")) {
  // place helper after imports
  const importEndIdx = (() => {
    const lines = s.split("\n");
    let i = 0;
    // include leading import lines
    while (i < lines.length && (lines[i].startsWith("import ") || lines[i].startsWith("export ") && lines[i].includes("from "))) i++;
    // also skip empty line(s)
    while (i < lines.length && lines[i].trim() === "") i++;
    // rebuild index
    let idx = 0;
    for (let j = 0; j < i; j++) idx += lines[j].length + 1;
    return idx;
  })();
  s = s.slice(0, importEndIdx) + helperBlock + s.slice(importEndIdx);
}

// Patch the proxy function body to call enforceRootRedirect first
// Handles either: `export function proxy(req: NextRequest) {` or `export async function proxy(...`
const re = /export\s+(async\s+)?function\s+proxy\s*\(\s*req\s*:\s*NextRequest\s*\)\s*\{/;
if (re.test(s)) {
  s = s.replace(re, (m) => `${m}\n  const __redir = enforceRootRedirect(req);\n  if (__redir) return __redir;\n`);
} else {
  // If proxy signature is different, append a safe exported proxy at end as fallback.
  s += `\n\n// Fallback proxy export added by script (could not patch existing signature)\nexport function proxy(req: NextRequest) {\n  const __redir = enforceRootRedirect(req);\n  if (__redir) return __redir;\n  return NextResponse.next();\n}\n`;
}

// Ensure config matcher exists (best-effort)
if (!s.includes("export const config")) {
  s += `\n\nexport const config = {\n  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],\n};\n`;
}

fs.writeFileSync(path, s, "utf8");
console.log("proxy.ts patched successfully.");
EON

    echo "✅ Patched proxy.ts"
  fi
fi

# 3) Retire middleware.ts to eliminate deprecation warning
if [ -f middleware.ts ]; then
  echo "🧾 Retiring middleware.ts -> .backup/middleware.ts.retired_${STAMP}"
  mkdir -p .backup
  cp -p middleware.ts ".backup/middleware.ts.retired_${STAMP}" || true
  rm -f middleware.ts
  echo "✅ middleware.ts removed (backup kept)"
else
  echo "ℹ️ middleware.ts not present (nothing to retire)"
fi

echo "✅ Migration complete"
