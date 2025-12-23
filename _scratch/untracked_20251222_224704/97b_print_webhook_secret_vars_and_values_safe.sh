#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🔎 Secret env var names referenced in $FILE:"
vars=$(grep -oE 'process\.env\.[A-Z0-9_]+' "$FILE" | sed 's/process\.env\.//' | sort -u || true)

if [ -z "${vars:-}" ]; then
  echo "  (none found?)"
  exit 0
fi

echo "$vars" | sed 's/^/  - /'

echo
echo "🔐 Safe check (runs in ./web so it reads the same env context):"

(
  cd web
  # Convert newline-separated vars into a bash array safely
  mapfile -t arr < <(printf "%s\n" "$vars")

  node <<'NODE' "${arr[@]}"
const vars = process.argv.slice(2);
const crypto = require("crypto");

function fp(v) {
  return crypto.createHash("sha256").update(String(v)).digest("hex").slice(0, 12);
}

for (const k of vars) {
  const v = process.env[k];
  if (!v) {
    console.log(`✖ ${k}: not set`);
  } else {
    console.log(`✔ ${k}: length=${String(v).length}, fp=${fp(String(v))}`);
  }
}
NODE
)
