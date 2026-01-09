#!/usr/bin/env bash
set -euo pipefail

ROOT="abando-frontend"
test -d "$ROOT" || { echo "❌ $ROOT not found"; exit 1; }

# Try common locations + fallback find
CANDIDATES=(
  "$ROOT/components/ShopifyBadge.tsx"
  "$ROOT/components/ShopifyBadge.jsx"
  "$ROOT/src/components/ShopifyBadge.tsx"
  "$ROOT/src/components/ShopifyBadge.jsx"
)

FILE=""
for f in "${CANDIDATES[@]}"; do
  if [ -f "$f" ]; then FILE="$f"; break; fi
done

if [ -z "$FILE" ]; then
  FILE="$(find "$ROOT" -maxdepth 5 -type f -iname "*shopifybadge*.ts*" -o -iname "*shopifybadge*.js*" | head -n 1 || true)"
fi

test -n "$FILE" || { echo "❌ Could not find ShopifyBadge component"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

cat > "$FILE" <<'BADGE'
import React from "react";

/**
 * ShopifyBadge
 * Replaces any fragile <img src="..."> badge with an inline SVG mark.
 * This prevents broken-image icons inside the embedded admin iframe.
 */
export default function ShopifyBadge({
  label = "Built for Shopify",
}: {
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
      {/* Simple Shopify-like bag mark (inline SVG to avoid asset/path issues) */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      >
        <path
          d="M6.6 5.9c.2-1.8 1.6-3.2 3.4-3.2s3.2 1.4 3.4 3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M4.6 6.2h10.8l-1 11.1c-.1.9-.8 1.7-1.8 1.7H7.4c-.9 0-1.7-.7-1.8-1.7L4.6 6.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>

      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-200">
        {label}
      </span>
    </div>
  );
}
BADGE

echo "== Patched: $FILE =="
echo "Backup: ${FILE}.bak.${TS}"
echo
echo "== Grep usage in embedded page =="
grep -RIn --line-number "ShopifyBadge" "$ROOT/app/embedded/page.tsx" 2>/dev/null || true
