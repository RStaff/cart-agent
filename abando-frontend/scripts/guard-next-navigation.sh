#!/usr/bin/env sh
set -eu
fail=0
# Any src/app/* importing next/navigation must declare "use client" pragma in top 5 lines
while IFS= read -r -d '' f; do
  if grep -Eq 'from[[:space:]]+["'\'']next/navigation["'\'']' "$f"; then
    if ! head -n 5 "$f" | grep -Eq '^("use client";|'\''use client'\'';)$'; then
      echo "❌ $f imports next/navigation without 'use client'"
      fail=1
    fi
  fi
done < <(find src/app -type f \( -name '*.ts' -o -name '*.tsx' \) -print0)
exit $fail
