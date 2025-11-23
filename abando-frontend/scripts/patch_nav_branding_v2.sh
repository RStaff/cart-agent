#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAV_FILE="$ROOT/src/components/NavbarV2.tsx"

echo "▶ Patching navbar branding in: $NAV_FILE"

if [ ! -f "$NAV_FILE" ]; then
  echo "❌ NavbarV2.tsx not found at $NAV_FILE"
  exit 1
fi

# 1) Ensure we import Image from next/image
if ! grep -q 'next/image' "$NAV_FILE"; then
  echo "▶ Adding Image import from next/image"
  perl -0pi -e 's{(from "next/link";)}{$1\nimport Image from "next/image";}g' "$NAV_FILE"
else
  echo "✅ Image import already present"
fi

# 2) Replace the brand block (first Link href="/") with logo + Abando™ text
echo "▶ Replacing primary brand Link (href=\"/\") with Abando logo + wordmark"

perl -0pi -e '
  s{<Link href="/"[^>]*>.*?</Link>}{
<Link href="/" className="flex items-center gap-2">
  <Image
    src="/brand/abando-logo-transparent.png"
    alt="Abando™ logo"
    width={32}
    height={32}
    className="h-8 w-auto"
    priority
  />
  <span className="text-sm font-semibold tracking-tight text-slate-100">
    Abando™
  </span>
</Link>
}s
' "$NAV_FILE"

# 3) Replace any existing "Proud Shopify Partner" block with a clean lockup
echo "▶ Updating Proud Shopify Partner lockup"

perl -0pi -e '
  s{<div[^>]*Proud Shopify Partner.*?</div>}{
<div className="flex items-center gap-2 text-xs text-slate-400">
  <span className="uppercase tracking-[0.16em]">
    Proud Shopify Partner
  </span>
  <Image
    src="/brand/shopify-logo-white.png"
    alt="Shopify logo"
    width={80}
    height={24}
    className="h-5 w-auto"
  />
</div>
}gs
' "$NAV_FILE"

echo "🏁 Navbar branding patch complete."
