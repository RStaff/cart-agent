#!/usr/bin/env bash
# --- auto-load .env.local if present (robust: supports quotes, spaces) ---
if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi
# --- end auto-load ---
set -euo pipefail

APP="$HOME/projects/cart-agent/abando-frontend/abando-frontend"
cd "$APP"

# 1) Point to your current icon image (JPEG/PNG with white bg)
#    If you saved the file you posted as public/abando_mark_source.jpg, this will work as-is.
SRC_CANDIDATES=(
  "public/abando_mark_source.jpg"
  "public/abando_logo_original_2048.png"
  "public/abando-mark-source.png"
)
SRC=""
for f in "${SRC_CANDIDATES[@]}"; do [[ -f "$f" ]] && SRC="$f" && break; done
[[ -n "$SRC" ]] || { echo "❌ Put your source image in public/ (e.g. public/abando_mark_source.jpg) and rerun."; exit 1; }

OUT="public"
echo "→ Using source: $SRC"

# 2) Remove white/cream background to transparency (tweak fuzz if needed)
convert "$SRC" -fuzz 8% -transparent white "$OUT/_tmp_no_bg.png"

# 3) Trim and add a little transparent padding so it sits nicely next to the wordmark
convert "$OUT/_tmp_no_bg.png" -trim +repage -bordercolor none -border 64 "$OUT/_tmp_mark.png"

# 4) Export sizes
convert "$OUT/_tmp_mark.png" -resize 1024x1024 "$OUT/abando-mark.png"
convert "$OUT/_tmp_mark.png" -resize 256x256   "$OUT/abando-mark-256.png"
convert "$OUT/_tmp_mark.png" -resize 64x64     "$OUT/abando-mark-64.png"
rm -f "$OUT/_tmp_no_bg.png" "$OUT/_tmp_mark.png"

echo "✅ Wrote:"
echo "   - $OUT/abando-mark.png"
echo "   - $OUT/abando-mark-256.png"
echo "   - $OUT/abando-mark-64.png"

# 5) Wire Brand.tsx to the new mark and ensure decorative alt=""
BRAND="src/app/v2/Brand.tsx"
if [[ -f "$BRAND" ]]; then
  cp "$BRAND" "$BRAND.bak.$(date +%Y%m%d-%H%M%S)"
  # If Brand.tsx exists, swap the src and alt in the first <Image .../>
  perl -0777 -i -pe 's|src="/[^"]+"|src="/abando-mark-256.png"|' "$BRAND"
  perl -0777 -i -pe 's|alt="[^"]*"|alt=""|' "$BRAND"
  echo "✅ Updated $BRAND → src=\"/abando-mark-256.png\", alt=\"\""
else
  # Create a minimal Brand.tsx if missing
  mkdir -p src/app/v2
  cat > "$BRAND" <<'TSX'
'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Abando home">
      <Image
        src="/abando-mark-256.png"
        alt=""
        width={28}
        height={28}
        className={styles.brandMark}
        priority
      />
      <span className={styles.brandWord}>Abando</span>
      <sup className={styles.tm}>™</sup>
    </Link>
  );
}
TSX
  echo "✅ Created $BRAND"
fi

echo "→ Done. Restart Next and hard refresh (Cmd+Shift+R)."
