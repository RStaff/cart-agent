#!/usr/bin/env bash
set -euo pipefail

echo "🔎 DATABASE_URL check (safe)"
echo "==========================="

for f in ".env" "web/.env"; do
  echo
  echo "— $f —"
  if [ ! -f "$f" ]; then
    echo "(missing)"
    continue
  fi

  # show whether it's set + a safe prefix check (no full value)
  line="$(grep -nE '^DATABASE_URL=' "$f" || true)"
  if [ -z "$line" ]; then
    echo "✖ DATABASE_URL not present"
    continue
  fi

  val="${line#*:DATABASE_URL=}"
  val="${val%$'\r'}"
  # Strip quotes for prefix check only
  v="${val%\"}"; v="${v#\"}"
  v="${v%\'}"; v="${v#\'}"

  if [[ "$v" == postgresql://* || "$v" == postgres://* ]]; then
    echo "✔ DATABASE_URL present and looks like Postgres (prefix OK)"
  else
    echo "❌ DATABASE_URL present but prefix is NOT postgres/postgresql"
    echo "   (value is hidden; fix needed)"
  fi
done
