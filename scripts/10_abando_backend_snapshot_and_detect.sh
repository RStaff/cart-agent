#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backup/abando_backend

echo "🧾 Repo: $(pwd)"

# Candidate entrypoints in order of likelihood (based on your past logs)
CANDIDATES=(
  "web/src/index.js"
  "server.js"
  "backend/src/index.js"
  "backend/index.js"
  "web/index.js"
)

ENTRY=""
for f in "${CANDIDATES[@]}"; do
  if [ -f "$f" ]; then
    ENTRY="$f"
    break
  fi
done

if [ -z "${ENTRY}" ]; then
  echo "❌ Could not find a known backend entrypoint."
  echo "Looked for:"
  printf "  - %s\n" "${CANDIDATES[@]}"
  exit 1
fi

cp -p "$ENTRY" ".backup/abando_backend/$(echo "$ENTRY" | tr '/' '__').${STAMP}.bak"
echo "✅ Snapshot: .backup/abando_backend/$(echo "$ENTRY" | tr '/' '__').${STAMP}.bak"
echo "✅ Detected backend entrypoint: $ENTRY"

# Write it to a file for other scripts to use
echo "$ENTRY" > .backup/abando_backend/ENTRYPOINT_PATH
echo "✅ Stored entrypoint path in .backup/abando_backend/ENTRYPOINT_PATH"
