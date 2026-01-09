#!/usr/bin/env bash
set -euo pipefail

ROOT="abando-frontend"
test -d "$ROOT" || { echo "❌ $ROOT not found"; exit 1; }

BADGE_FILE="$ROOT/src/components/ShopifyBadge.tsx"
test -f "$BADGE_FILE" || { echo "❌ $BADGE_FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$BADGE_FILE" "${BADGE_FILE}.bak.${TS}"

echo "== 1) Searching for 'Built for Shopify' SVG in public/ (preferred) =="
mapfile -t CANDIDATES < <(
  find "$ROOT/public" -type f \( \
    -iname "*built*shopify*.svg" -o \
    -iname "*built-for-shopify*.svg" -o \
    -iname "*bfs*.svg" -o \
    -iname "*shopify*badge*.svg" -o \
    -iname "*built*.svg" \
  \) 2>/dev/null | sort
)

if [ "${#CANDIDATES[@]}" -eq 0 ]; then
  echo "== No matches in public/. Searching entire frontend for SVG candidates =="
  mapfile -t CANDIDATES < <(
    find "$ROOT" -type f -iname "*.svg" 2>/dev/null \
      | grep -Ei 'built|shopify|badge|bfs' \
      | sort || true
  )
fi

if [ "${#CANDIDATES[@]}" -eq 0 ]; then
  echo "❌ Could not find any likely Built-for-Shopify SVG files."
  echo "TIP: if you have the asset elsewhere, drop it into $ROOT/public/ and rerun."
  exit 1
fi

echo "== 2) Candidates found =="
i=0
for f in "${CANDIDATES[@]}"; do
  i=$((i+1))
  echo "  [$i] $f"
done
echo

# Choose best match (prefer filenames containing 'built-for-shopify' then 'built' + 'shopify')
PICK=""
for f in "${CANDIDATES[@]}"; do
  if echo "$f" | grep -qiE 'built[-_ ]?for[-_ ]?shopify'; then PICK="$f"; break; fi
done
if [ -z "$PICK" ]; then
  for f in "${CANDIDATES[@]}"; do
    if echo "$f" | grep -qiE 'built.*shopify'; then PICK="$f"; break; fi
  done
fi
if [ -z "$PICK" ]; then PICK="${CANDIDATES[0]}"; fi

echo "== 3) Selected SVG =="
echo "  $PICK"
echo

# Compute public URL if inside public/
PUBLIC_PREFIX="$ROOT/public/"
if [[ "$PICK" == "$PUBLIC_PREFIX"* ]]; then
  REL="${PICK#"$PUBLIC_PREFIX"}"
  URL="/$REL"
else
  # If not in public, we copy it into public/assets/ so it can be referenced safely at runtime
  mkdir -p "$ROOT/public/assets"
  BASENAME="$(basename "$PICK")"
  cp -v "$PICK" "$ROOT/public/assets/$BASENAME"
  URL="/assets/$BASENAME"
  echo "== Copied SVG into public for safe serving: $ROOT/public/assets/$BASENAME =="
fi

echo "== 4) Rewriting ShopifyBadge component to use the official SVG asset =="
cat > "$BADGE_FILE" <<EOC
"use client";

export default function ShopifyBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
      <img
        src="$URL"
        alt="Built for Shopify"
        className="h-4 w-auto"
        loading="eager"
      />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-200">
        Built for Shopify
      </span>
    </div>
  );
}
EOC

echo "== 5) Sanity: show ShopifyBadge.tsx =="
nl -ba "$BADGE_FILE" | sed -n '1,120p'
echo
echo "✅ ShopifyBadge now points to: $URL"
echo "🧾 Backup: ${BADGE_FILE}.bak.${TS}"
