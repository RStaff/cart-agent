#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Cart Agent backend diagnostics (minimal)"

# 1) Find package.json files near the top (no node_modules)
projects=$(find . -maxdepth 3 -type f -name package.json ! -path "*/node_modules/*" | sort)

echo
echo "📁 Node projects (maxdepth 3):"
if [[ -z "$projects" ]]; then
  echo "  (none found)"
  echo "✅ Done."
  exit 0
fi

echo "$projects" | nl -ba
echo

# 2) Guess backend candidates: paths containing /api/ or /server/
candidates=$(echo "$projects" | grep -E "/(api|server)/package.json" || true)

if [[ -z "$candidates" ]]; then
  echo "⚠️ No obvious 'api' or 'server' project found."
  echo
  echo "✅ Done. (Nothing more to scan tonight.)"
  exit 0
fi

echo "🧩 Backend candidates:"
echo "$candidates"
echo

# 3) For each candidate, just say whether it uses express/fastify (1 line each)
while read -r pkg; do
  [[ -z "$pkg" ]] && continue
  dir=$(dirname "$pkg")
  summary=""

  if grep -q '"express"' "$pkg";  then summary="${summary} express";  fi
  if grep -q '"fastify"' "$pkg";  then summary="${summary} fastify";  fi

  if [[ -z "$summary" ]]; then
    summary=" (no express/fastify dependency found)"
  fi

  echo "• $dir ->$summary"
done <<< "$candidates"

echo
echo "🔍 Looking for '/api/health' in backend candidates:"
grep -R "api/health" $(echo "$candidates" | xargs -n1 dirname) \
  --exclude-dir=node_modules 2>/dev/null \
  || echo "  (no /api/health handlers yet)"

echo
echo "✅ Diagnostics done (minimal output mode)."
