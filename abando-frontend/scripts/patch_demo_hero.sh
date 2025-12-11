#!/usr/bin/env bash
set -e

FILE="app/demo/playground/page.tsx"

echo "🔧 Patching hero section (logo + formatting)…"

# Replace old transparent PNG usage with <BrandLogo />
sed -i '' 's#<Image[^>]*src="/abando-logo-transparent.png"[^>]*>#<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-500/40"><BrandLogo width={28} height={26} /></div>#g' "$FILE"

# Ensure BrandLogo import exists
if ! grep -q "BrandLogo" "$FILE"; then
  sed -i '' '1s#^#import { BrandLogo } from "@/components/BrandLogo";\n#' "$FILE"
fi

echo "✅ Hero logo formatting patched."
