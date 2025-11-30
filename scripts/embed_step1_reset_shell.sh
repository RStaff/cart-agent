#!/usr/bin/env bash
set -euo pipefail

# Abando – Step 1: Reset /embedded shell page

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==============================="
echo " Abando – Reset Embedded Shell "
echo "==============================="
echo "Repo root : $ROOT"
echo "Branch    : $(git rev-parse --abbrev-ref HEAD)"
echo

EMBED_DIR="$ROOT/abando-frontend/app/embedded"
mkdir -p "$EMBED_DIR"

# If an old JS page exists, back it up so we don't collide with TSX.
if [ -f "$EMBED_DIR/page.jsx" ]; then
  TS="$(date +%Y%m%d_%H%M%S)"
  BACKUP="$EMBED_DIR/page.jsx.bak-${TS}"
  echo "→ Backing up existing page.jsx to:"
  echo "   $BACKUP"
  mv "$EMBED_DIR/page.jsx" "$BACKUP"
  echo
fi

echo "→ Writing fresh embedded shell to page.tsx"

cat > "$EMBED_DIR/page.tsx" <<'EOS'
// file: abando-frontend/app/embedded/page.tsx
import React from "react";

export default function EmbeddedPage() {
  return (
    <main
      style={{
        padding: "1.5rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
        Abando – Shopify Embedded App
      </h1>
      <p style={{ maxWidth: 520, lineHeight: 1.5 }}>
        This is the embedded shell for Abando inside the Shopify admin.
        The full cart-recovery controls and merchant settings will live here.
      </p>
      <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", opacity: 0.85 }}>
        Current state: v0.1 shell only. Safe to load and demo without any
        Shopify-specific wiring yet.
      </p>
    </main>
  );
}
EOS

echo
echo "✅ Embedded shell written to:"
echo "   $EMBED_DIR/page.tsx"
