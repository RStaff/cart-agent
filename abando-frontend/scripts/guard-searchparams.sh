#!/usr/bin/env sh
set -eu
warn=0
while IFS= read -r f; do
  [ -f "$f" ] || continue
  # Typing as Record<...> is a smell in Next 15 server pages
  if grep -Eq 'export default (async )?function' "$f" && grep -q 'searchParams' "$f"; then
    if grep -Eq 'searchParams[[:space:]]*\?\:[[:space:]]*Record<' "$f"; then
      echo "⚠️  $f types searchParams as Record<...>; use AppPageProps + normalizeSearchParams()"
      warn=1
    fi
    if ! grep -Eq '^export default async function' "$f"; then
      echo "⚠️  $f has searchParams but is not async"
      warn=1
    fi
  fi
done <<EOF
$(find src/app -type f -name 'page.tsx' -print)
EOF
exit 0
