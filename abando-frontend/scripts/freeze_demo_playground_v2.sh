#!/usr/bin/env bash
set -euo pipefail

# Resolve paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGE="${ROOT_DIR}/app/demo/playground/page.tsx"
CANONICAL="${ROOT_DIR}/app/demo/playground/page.canonical.v2.tsx"
RESET_SCRIPT="${ROOT_DIR}/scripts/reset_demo_playground_to_v2.sh"

if [ ! -f "$PAGE" ]; then
  echo "❌ Could not find demo page at: $PAGE"
  exit 1
fi

# Save canonical v2 (with backup if it already exists)
if [ -f "$CANONICAL" ]; then
  BACKUP="${CANONICAL}.backup.$(date +%s).tsx"
  cp "$PAGE" "$BACKUP"
  echo "ℹ️ Canonical v2 already existed. Current page snapshot saved to:"
  echo "   $BACKUP"
else
  cp "$PAGE" "$CANONICAL"
  echo "✅ Saved canonical v2 to:"
  echo "   $CANONICAL"
fi

# Create/reset helper script to restore v2
cat > "$RESET_SCRIPT" << 'INNER_EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CANONICAL="${ROOT_DIR}/app/demo/playground/page.canonical.v2.tsx"
TARGET="${ROOT_DIR}/app/demo/playground/page.tsx"

if [ ! -f "$CANONICAL" ]; then
  echo "❌ Canonical v2 not found:"
  echo "   $CANONICAL"
  exit 1
fi

cp "$CANONICAL" "$TARGET"
echo "✅ /demo/playground restored to canonical v2."
INNER_EOF

chmod +x "$RESET_SCRIPT"
echo "✅ Created reset script:"
echo "   $RESET_SCRIPT"
echo
echo "➡  Any time you want this exact demo back, run:"
echo "   ./scripts/reset_demo_playground_to_v2.sh"
