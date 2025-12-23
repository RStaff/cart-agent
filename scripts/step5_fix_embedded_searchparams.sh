#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

TARGET="abando-frontend/app/embedded/page.tsx"
if [ ! -f "$TARGET" ]; then
  echo "❌ Missing: $TARGET"
  exit 1
fi

cp "$TARGET" "$TARGET.bak_$(date +%s)"

node - <<'NODE'
const fs = require("fs");
const file = "abando-frontend/app/embedded/page.tsx";
let s = fs.readFileSync(file,"utf8");

// Force searchParams to be Promise-safe for Next 16+ (sync dynamic APIs)
s = s.replace(
  /searchParams:\s*\{\s*shop\?:\s*string\s*;\s*\}\s*;/g,
  "searchParams: Promise<{ shop?: string }>;");

if (!s.includes("const sp = await searchParams;")) {
  // Replace any direct usage of searchParams?.shop
  s = s.replace(
    /const\s+shop\s*=\s*\(searchParams\?\.(shop)\s*\|\|\s*""\)\.trim\(\);/g,
    "const sp = await searchParams;\n  const shop = String(sp?.shop || \"\").trim();"
  );

  // If that exact pattern isn't present, do a safer generic insertion:
  if (!s.includes("const shop = String(sp?.shop")) {
    // insert after function signature line
    s = s.replace(
      /(export default async function EmbeddedPage\([\s\S]*?\)\s*\{\s*)/,
      `$1\n  const sp = await searchParams;\n  const shop = String(sp?.shop || "").trim();\n`
    );
    // remove any previous shop assignment that uses searchParams directly
    s = s.replace(/const\s+shop\s*=\s*.*searchParams.*\n/g, "");
  }
}

fs.writeFileSync(file, s);
console.log("✅ Patched searchParams handling in", file);
NODE

echo "✅ Done."
echo "NEXT:"
echo "  ./scripts/step5_restart_and_smoke_ui.sh example.myshopify.com"
