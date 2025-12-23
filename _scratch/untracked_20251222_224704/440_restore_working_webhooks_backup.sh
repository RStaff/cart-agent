#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

# Safety backup of current state
cp "$FILE" "$FILE.bak_before_restore_$(date +%s)"
echo "✅ Saved current file as $FILE.bak_before_restore_*"

# ESM import test
IMPORT_TEST='node --input-type=module -e "import(\\"file://\\"+process.cwd()+\\"/'"$FILE"'\\" ).then(()=>process.exit(0)).catch(()=>process.exit(1))"'

# Find backups newest-first
mapfile -t backups < <(ls -1t "$FILE".bak_* 2>/dev/null || true)
if [ ${#backups[@]} -eq 0 ]; then
  echo "❌ No backups found: $FILE.bak_*"
  exit 1
fi

echo "🔎 Testing backups (newest → oldest) until one imports cleanly..."
for b in "${backups[@]}"; do
  cp "$b" "$FILE"
  if bash -lc "$IMPORT_TEST" >/dev/null 2>&1; then
    echo "✅ Restored WORKING backup: $b"
    echo "✅ Confirmed: webhooks.js imports as ESM"
    exit 0
  else
    echo " - not ok: $b"
  fi
done

echo "❌ None of the backups imported cleanly."
echo "   Your project may be treating .js as CommonJS (package.json type), or every backup is broken."
exit 1
