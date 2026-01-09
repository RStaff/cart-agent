#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== Searching for the literal text 'Invalid path' in the repo =="
MATCHES="$(grep -RIn --exclude-dir=node_modules --exclude-dir=.git "Invalid path" . || true)"

if [ -z "$MATCHES" ]; then
  echo "❌ No matches found for 'Invalid path' (unexpected given your curl output)."
  exit 1
fi

echo "$MATCHES"
echo
echo "== Showing context for each match (10 lines before/after) =="
while IFS= read -r line; do
  FILE="$(echo "$line" | cut -d: -f1)"
  LINENO="$(echo "$line" | cut -d: -f2)"
  echo
  echo "----- $FILE:$LINENO -----"
  START=$((LINENO-10)); if [ $START -lt 1 ]; then START=1; fi
  END=$((LINENO+10))
  nl -ba "$FILE" | sed -n "${START},${END}p"
done <<< "$MATCHES"
