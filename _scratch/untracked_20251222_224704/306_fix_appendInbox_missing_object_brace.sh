#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="$FILE.bak_fix_stage_obj_$(date +%s)"
cp "$FILE" "$BK"
echo "🧾 Backup: $BK"

# If we have appendInbox( followed by stage: on the next line, ensure it becomes appendInbox({
perl -0777 -i -pe '
  s/appendInbox\(\s*\n(\s*)stage\s*:/appendInbox({\n$1stage:/g;
' "$FILE"

echo "✅ Patched appendInbox( → appendInbox({ when followed by stage:"

echo
echo "🔎 Proof: show the area around stage:"
rg -n "appendInbox\(|stage:\s*\"received\"|stage:\s*\"verified\"" "$FILE" || true
