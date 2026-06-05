#!/usr/bin/env bash
set -eu

APP_DIR="app"
fail=0

if [ ! -d "$APP_DIR" ]; then
  echo "❌ expected app directory '$APP_DIR' was not found"
  exit 1
fi

# Any app/* client component using next/navigation hooks must declare "use client" pragma in top 5 lines.
while IFS= read -r -d '' f; do
  if grep -Eq 'from[[:space:]]+["'\'']next/navigation["'\'']' "$f" && \
     grep -Eq 'use(Router|SearchParams|Pathname|SelectedLayoutSegments?)' "$f"; then
    if ! head -n 5 "$f" | grep -Eq '^("use client";|'\''use client'\'';)$'; then
      echo "❌ $f imports next/navigation without 'use client'"
      fail=1
    fi
  fi
done < <(find "$APP_DIR" -type f \( -name '*.ts' -o -name '*.tsx' \) -print0)

exit $fail
