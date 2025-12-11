#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$REPO_ROOT/app/demo/playground/_components/Hero.tsx"

echo "[inject-logo] Target: $TARGET"

if [ ! -f "$TARGET" ]; then
  echo "[inject-logo] ❌ Hero.tsx not found at expected path."
  exit 1
fi

# If it's already using the inline logo, exit cleanly
if grep -q "abando-logo-inline.png" "$TARGET"; then
  echo "[inject-logo] Already using abando-logo-inline.png → nothing to do."
  exit 0
fi

TMP_FILE="$TARGET.tmp"

awk '
  /<section[^>]*>/ && !inserted {
    print $0
    print "      <div className=\"flex items-center space-x-3 mb-6\">"
    print "        <Image src=\"/abando-logo-inline.png\" alt=\"Abando\" width={140} height={32} priority />"
    print "      </div>"
    inserted = 1
    next
  }
  { print $0 }
' "$TARGET" > "$TMP_FILE"

mv "$TMP_FILE" "$TARGET"

echo "[inject-logo] ✅ Injected inline Abando logo into Hero.tsx"
