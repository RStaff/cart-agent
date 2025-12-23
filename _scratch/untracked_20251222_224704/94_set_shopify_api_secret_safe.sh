#!/usr/bin/env bash
set -euo pipefail

KEY="SHOPIFY_API_SECRET"

echo "🔐 Paste your REAL Shopify App API secret key now (input hidden)."
echo "   (From Shopify Partners dashboard → Apps → Abando AI Cart Agent → API credentials)"
read -r -s -p "API secret key: " SECRET
echo
test -n "$SECRET" || { echo "❌ Empty secret. Aborting."; exit 1; }

stamp="$(date +%s)"

patch_file () {
  local file="$1"
  test -f "$file" || return 0

  cp "$file" "$file.bak_${stamp}"
  node <<'NODE'
import fs from "node:fs";

const file = process.env.FILE;
const key  = process.env.KEY;
const val  = process.env.SECRET;

let s = fs.readFileSync(file, "utf8");

// Normalize line endings
s = s.replace(/\r\n/g, "\n");

// Replace existing KEY=... line, else append
const re = new RegExp(`^${key}=.*$`, "m");
if (re.test(s)) {
  s = s.replace(re, `${key}=${val}`);
} else {
  if (!s.endsWith("\n")) s += "\n";
  s += `${key}=${val}\n`;
}

fs.writeFileSync(file, s, "utf8");
NODE
  echo "✅ Updated $file (backup: $file.bak_${stamp})"
}

export KEY SECRET

echo "🧾 Updating env files..."
for f in ".env" "web/.env"; do
  if [ -f "$f" ]; then
    FILE="$f" patch_file "$f"
  else
    echo "↪ Skipped (not found): $f"
  fi
done

unset SECRET
echo "✅ Done. Restart your dev stack for the new env to load."
