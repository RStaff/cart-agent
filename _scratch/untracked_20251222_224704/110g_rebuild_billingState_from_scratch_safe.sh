#!/usr/bin/env bash
set -euo pipefail

stamp="$(date +%s)"

# Detect web root
WEB_ROOT=""
if [ -d "web/src" ]; then
  WEB_ROOT="web"
elif [ -d "src" ]; then
  WEB_ROOT="."
else
  echo "❌ Cannot find web root."
  echo "   Looked for: ./web/src  OR  ./src"
  echo
  echo "   Run this and paste output:"
  echo "   ls -la"
  echo "   find . -maxdepth 3 -type d -name src -print"
  exit 1
fi

FILE="${WEB_ROOT}/src/db/billingState.js"
mkdir -p "$(dirname "$FILE")"

if [ -f "$FILE" ]; then
  cp "$FILE" "$FILE.broken_${stamp}"
  echo "✅ Saved existing file: $FILE.broken_${stamp}"
fi

cat > "$FILE" <<'JS'
// src/db/billingState.js (ESM)
// Defensive DB helpers for billing state.
// Never throw: callers should handle null/false.

async function loadPrisma() {
  const candidates = [
    "../db.js",            // e.g. src/db.js
    "../lib/prisma.js",    // e.g. src/lib/prisma.js
    "./prisma.js",         // e.g. src/db/prisma.js
  ];

  for (const p of candidates) {
    try {
      const mod = await import(p);
      const prisma =
        mod?.prisma ||
        mod?.default?.prisma ||
        mod?.default;

      if (prisma && typeof prisma === "object") return prisma;
    } catch (_e) {}
  }
  return null;
}

export async function getBillingState(shop) {
  try {
    const prisma = await loadPrisma();
    if (!prisma?.billingState?.findUnique) return null;
    if (!shop) return null;

    return await prisma.billingState.findUnique({
      where: { shop: String(shop) },
    });
  } catch (_e) {
    return null;
  }
}

export async function setBillingState(shop, data = {}) {
  try {
    const prisma = await loadPrisma();
    if (!prisma?.billingState?.upsert) return false;
    if (!shop) return false;

    await prisma.billingState.upsert({
      where: { shop: String(shop) },
      create: { shop: String(shop), ...data },
      update: { ...data },
    });

    return true;
  } catch (_e) {
    return false;
  }
}
JS

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ Rebuilt: $FILE (parses)"
echo "✅ WEB_ROOT detected as: $WEB_ROOT"
