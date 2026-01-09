#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

# --- Find likely frontend directory (prefer Next.js app) ---
CANDIDATES=(
  "abando-frontend"
  "web/frontend"
  "web"
  "frontend"
)

FRONT=""
for d in "${CANDIDATES[@]}"; do
  if [ -d "$d" ]; then
    # Try to detect Next.js app dir
    if [ -d "$d/app" ] || [ -f "$d/next.config.js" ] || [ -f "$d/next.config.mjs" ]; then
      FRONT="$d"
      break
    fi
  fi
done

if [ -z "$FRONT" ]; then
  echo "❌ Could not auto-detect frontend directory."
  echo "   Looked for: ${CANDIDATES[*]}"
  echo "   If your Next app lives elsewhere, add it to CANDIDATES in this script."
  exit 1
fi

echo "✅ Frontend detected: $FRONT"

# --- Ensure dependencies exist (only if package.json present) ---
if [ ! -f "$FRONT/package.json" ]; then
  echo "❌ $FRONT/package.json not found. This doesn't look like a Node frontend."
  exit 1
fi

# Install App Bridge React if missing
if ! grep -q '"@shopify/app-bridge-react"' "$FRONT/package.json"; then
  echo "== Installing @shopify/app-bridge-react (missing) =="
  npm -C "$FRONT" i @shopify/app-bridge-react
else
  echo "== @shopify/app-bridge-react already present =="
fi

# --- Pick the safest file to patch ---
# Priority:
# 1) app/embedded/layout.(t|j)sx
# 2) app/embedded/page.(t|j)sx
# 3) app/layout.(t|j)sx
TARGET=""

for f in \
  "$FRONT/app/embedded/layout.tsx" \
  "$FRONT/app/embedded/layout.jsx" \
  "$FRONT/app/embedded/page.tsx" \
  "$FRONT/app/embedded/page.jsx" \
  "$FRONT/app/layout.tsx" \
  "$FRONT/app/layout.jsx"
do
  if [ -f "$f" ]; then
    TARGET="$f"
    break
  fi
done

if [ -z "$TARGET" ]; then
  echo "❌ Could not find a Next.js app router file to patch."
  echo "   Expected one of:"
  echo "   - $FRONT/app/embedded/layout.tsx|jsx"
  echo "   - $FRONT/app/embedded/page.tsx|jsx"
  echo "   - $FRONT/app/layout.tsx|jsx"
  exit 1
fi

echo "✅ Target file: $TARGET"

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$TARGET" "${TARGET}.bak.${TS}"

# --- If TitleBar already exists, do nothing ---
if grep -q "TitleBar" "$TARGET"; then
  echo "ℹ️ TitleBar already referenced in $TARGET — no changes made."
  echo "✅ Backup: ${TARGET}.bak.${TS}"
  exit 0
fi

# --- Add import + component in a conservative way ---
# We insert:
#   import { TitleBar } from '@shopify/app-bridge-react';
# and somewhere right after the first JSX return opening we insert:
#   <TitleBar title="Abando" />
#
# This avoids changing layout structure or requiring new providers.
# If you already have App Bridge provider elsewhere, TitleBar will bind correctly.

echo "== Patching (import + component) =="

# 1) Add import near top (after existing imports)
perl -0777 -i -pe '
  if ($ARGV eq "'"$TARGET"'") {
    # If file has any import statements, insert after the last import
    if ($_ =~ /(^import[^\n]*\n(?:import[^\n]*\n)*)/m) {
      my $imports = $1;
      my $rest = substr($_, length($imports));
      # Avoid duplicate import
      if ($imports !~ /TitleBar\s*\}/) {
        $imports .= "import { TitleBar } from '\''@shopify/app-bridge-react'\'';\n";
      }
      $_ = $imports . $rest;
    } else {
      # No imports at all — prepend
      $_ = "import { TitleBar } from '\''@shopify/app-bridge-react'\'';\n\n" . $_;
    }

    # 2) Insert <TitleBar title="Abando" /> inside first returned JSX fragment/container
    # Look for "return (" and insert right after it (with indentation)
    if ($_ !~ /<TitleBar\s+title=/) {
      $_ =~ s/return\s*\(\s*\n/return (\n      <TitleBar title="Abando" \/>\n/sm;
    }
  }
' "$TARGET"

echo "== Patch result (grep) =="
grep -nE "TitleBar|app-bridge-react" "$TARGET" || true

echo
echo "✅ Done."
echo "🧾 Backup: ${TARGET}.bak.${TS}"
