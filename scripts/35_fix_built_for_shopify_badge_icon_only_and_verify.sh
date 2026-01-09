#!/usr/bin/env bash
set -euo pipefail

ROOT="abando-frontend"
BADGE_FILE="$ROOT/src/components/ShopifyBadge.tsx"

test -d "$ROOT" || { echo "❌ $ROOT not found"; exit 1; }
test -f "$BADGE_FILE" || { echo "❌ $BADGE_FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$BADGE_FILE" "${BADGE_FILE}.bak.${TS}"

echo "== 1) Read current SVG/IMG URL from ShopifyBadge.tsx =="
URL="$(perl -ne 'if (/src="([^"]+)"/) { print $1; exit }' "$BADGE_FILE" || true)"
if [ -z "${URL:-}" ]; then
  echo "❌ Could not detect src=\"...\" in $BADGE_FILE"
  echo "   (We can still fix layout, but first we need a URL.)"
  exit 1
fi
echo "Detected URL: $URL"
echo

echo "== 2) Verify the asset exists on disk (public/) =="
if [[ "$URL" == /* ]]; then
  REL="${URL#/}" # remove leading /
  if [ -f "$ROOT/public/$REL" ]; then
    echo "✅ File exists: $ROOT/public/$REL"
  else
    echo "❌ File NOT found at: $ROOT/public/$REL"
    echo "   This is why you see the broken image icon."
    echo "   We'll try to locate a likely SVG and copy it into place."
    echo

    echo "== 2b) Searching for likely Built-for-Shopify SVG in $ROOT/public =="
    mapfile -t CANDS < <(
      find "$ROOT/public" -type f -iname "*.svg" 2>/dev/null \
        | grep -Ei 'built|shopify|badge|bfs' \
        | sort || true
    )
    if [ "${#CANDS[@]}" -eq 0 ]; then
      echo "❌ No likely SVG found in public/. Put the official SVG into $ROOT/public/$REL and rerun."
      exit 1
    fi

    echo "Candidates:"
    i=0
    for f in "${CANDS[@]}"; do i=$((i+1)); echo "  [$i] $f"; done

    PICK=""
    for f in "${CANDS[@]}"; do
      if echo "$f" | grep -qiE 'built[-_ ]?for[-_ ]?shopify'; then PICK="$f"; break; fi
    done
    if [ -z "$PICK" ]; then PICK="${CANDS[0]}"; fi

    echo
    echo "Selected: $PICK"
    mkdir -p "$(dirname "$ROOT/public/$REL")"
    cp -v "$PICK" "$ROOT/public/$REL"
    echo "✅ Copied into: $ROOT/public/$REL"
  fi
else
  echo "⚠️ URL is not root-relative ($URL). This can break in Shopify iframe. We'll normalize it."
  # normalize to /assets/built-for-shopify.svg
  mkdir -p "$ROOT/public/assets"
  # try to find a candidate svg in public
  PICK="$(find "$ROOT/public" -type f -iname "*.svg" 2>/dev/null | grep -Ei 'built|shopify|badge|bfs' | head -n 1 || true)"
  if [ -z "$PICK" ]; then
    echo "❌ No SVG candidate found to normalize. Put the official SVG in $ROOT/public/assets/ and rerun."
    exit 1
  fi
  cp -v "$PICK" "$ROOT/public/assets/$(basename "$PICK")"
  URL="/assets/$(basename "$PICK")"
  echo "✅ Normalized URL to: $URL"
fi
echo

echo "== 3) Rewrite ShopifyBadge to ICON-ONLY (prevents duplicate/overlap text) =="
cat > "$BADGE_FILE" <<EOC
"use client";

export default function ShopifyBadge() {
  return (
    <img
      src="$URL"
      alt="Built for Shopify"
      className="h-4 w-auto shrink-0"
      loading="eager"
      draggable={false}
    />
  );
}
EOC

echo "✅ Updated: $BADGE_FILE"
echo "🧾 Backup: ${BADGE_FILE}.bak.${TS}"
echo

echo "== 4) Quick local asset check (expects 200/304) =="
if command -v curl >/dev/null 2>&1; then
  echo "-- HEAD http://localhost:3000$URL --"
  curl -sI "http://localhost:3000$URL" | head -n 8 || true
  echo
fi

echo "== 5) Build (guards against bigger problems) =="
npm -C "$ROOT" run build

echo
echo "✅ Done. If the icon still shows broken in Shopify, the next suspect is the iframe origin URL (tunnel vs www.abando.ai) not serving the same /public asset."
