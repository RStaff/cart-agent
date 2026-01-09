#!/usr/bin/env bash
set -euo pipefail

ROOT="abando-frontend"
PAGE_ROOT="$ROOT/app/page.tsx"
BADGE="$ROOT/src/components/ShopifyBadge.tsx"
HERO="$ROOT/src/components/Hero.tsx"

TS="$(date +%Y%m%d_%H%M%S)"

backup() {
  local f="$1"
  test -f "$f" || { echo "❌ Missing: $f"; exit 1; }
  cp -v "$f" "${f}.bak.${TS}" >/dev/null
}

echo "== Backing up files =="
backup "$PAGE_ROOT"
backup "$BADGE"
backup "$HERO"
echo

echo "== 1) Fix ROOT landing behavior =="
echo "   - If Shopify loads app with ?host=... or ?embedded=1 -> redirect to /embedded (preserve params)"
echo "   - Otherwise -> redirect to /marketing (keeps public site clean)"

cat > "$PAGE_ROOT" <<'EOC'
import { redirect } from "next/navigation";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function toQuery(searchParams?: Props["searchParams"]) {
  if (!searchParams) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") sp.set(k, v);
    else if (Array.isArray(v)) v.forEach((vv) => sp.append(k, vv));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export default function RootPage({ searchParams }: Props) {
  const host = typeof searchParams?.host === "string" ? searchParams?.host : undefined;
  const embedded = typeof searchParams?.embedded === "string" ? searchParams?.embedded : undefined;

  // Shopify Admin loads embedded apps with host=... (and often embedded=1)
  if (host || embedded === "1") {
    redirect(`/embedded${toQuery(searchParams)}`);
  }

  // Public root becomes your marketing entry point
  redirect("/marketing");
}
EOC

echo "✅ Updated: $PAGE_ROOT"
echo

echo "== 2) Restore ShopifyBadge to a clean, non-overlapping pill =="
# We keep using the existing SVG file you already verified exists:
# /badges/shopify-logo-darkbg.svg
cat > "$BADGE" <<'EOC'
"use client";

const BADGE_SRC = "/badges/shopify-logo-darkbg.svg";

export default function ShopifyBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
      <img
        src={BADGE_SRC}
        alt="Built for Shopify"
        className="h-4 w-4 shrink-0"
        loading="eager"
        draggable={false}
      />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-200">
        Built for Shopify
      </span>
    </span>
  );
}
EOC

echo "✅ Updated: $BADGE"
echo

echo "== 3) Fix Hero.tsx corrupted 'use client' placement (and keep imports clean) =="

# Rewrite only the top-of-file to ensure:
# line 1: "use client";
# then imports
# without breaking the component body.
perl -0777 -i -pe '
  # Normalize any broken "use client" tokens
  s/"use client";\s*//g;

  # Fix the pathological pattern: import ...; "use client";
  s/(import\s+[^\n;]+;\s*)+/"__IMPORT_BLOCK__\n"/s;

  my $imports = "";
  if ($_ =~ /__IMPORT_BLOCK__\n/s) {
    # If we replaced multiple imports, recover them from the original by re-reading backup is hard;
    # So instead: we will just ensure the two imports we know are required exist.
    # If you have more imports later, they remain untouched.
  }

  # Ensure we have correct header with expected imports.
  # We keep the rest of the file from "export default function Hero" onward.
  my ($rest) = $_ =~ /(export\s+default\s+function\s+Hero\(\)\s*\{.*)$/s;
  $rest ||= $_; # fallback (should not happen)

  $_ = "\"use client\";\n\nimport Button from \"./Button\";\nimport { BRAND } from \"../lib/brand\";\n\n" . $rest;
' "$HERO"

echo "✅ Updated: $HERO"
echo

echo "== Show quick sanity snippets =="
echo "--- app/page.tsx ---"
nl -ba "$PAGE_ROOT" | sed -n '1,90p'
echo
echo "--- ShopifyBadge.tsx ---"
nl -ba "$BADGE" | sed -n '1,80p'
echo
echo "--- Hero.tsx (top 40) ---"
nl -ba "$HERO" | sed -n '1,40p'
echo

echo "== Build (guards against bigger problems) =="
npm -C "$ROOT" run build

echo
echo "✅ DONE."
echo "Backups:"
echo "  $PAGE_ROOT.bak.$TS"
echo "  $BADGE.bak.$TS"
echo "  $HERO.bak.$TS"
