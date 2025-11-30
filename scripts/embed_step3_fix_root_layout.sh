#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/abando-frontend/app"

echo "=============================="
echo " Abando – Fix Root Layout     "
echo "=============================="
echo "App dir: $APP_DIR"
echo

TS="$(date +%Y%m%d_%H%M%S)"

# Backup any existing layout.* files (if any)
shopt -s nullglob
LAYOUT_FILES=("$APP_DIR"/layout.*)
shopt -u nullglob

if [ "${#LAYOUT_FILES[@]}" -gt 0 ]; then
  echo "→ Backing up existing layout files..."
  for f in "${LAYOUT_FILES[@]}"; do
    base="$(basename "$f")"
    backup="$APP_DIR/_backup_${TS}_${base}"
    mv "$f" "$backup"
    echo "   - $base → $(basename "$backup")"
  done
else
  echo "→ No existing layout.* files found; creating a fresh one."
fi

cat > "$APP_DIR/layout.tsx" <<'LAYOUT'
import React from "react";

export const metadata = {
  title: "Abando",
  description: "Abando – AI cart recovery and checkout agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
LAYOUT

echo
echo "✅ New root layout.tsx created at $APP_DIR/layout.tsx"
