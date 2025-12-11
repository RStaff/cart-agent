#!/bin/bash

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[abando] Backing up ${TARGET} -> ${BACKUP}"
cp "$TARGET" "$BACKUP"

# Replace supplement links with "See other verticals"
gsed -i '' 's/See supplements playbook/See other verticals/g' "$TARGET"
gsed -i '' 's|/marketing/supplements/playbook|/marketing|g' "$TARGET"

echo "[abando] Sidebar CTA cleanup complete."
echo "[abando] Run: npm run dev"
