#!/usr/bin/env bash

set -euo pipefail

TARGET="src/app/command-center/page.js"

if [ -f "$TARGET" ]; then
  echo "🔎 Found duplicate: $TARGET"
  rm "$TARGET"
  echo "🗑 Removed page.js duplicate."
else
  echo "✅ No duplicate page.js file found."
fi

echo "All set."
