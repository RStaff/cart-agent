#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

FILE="scripts/32_verify_web_3000.sh"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

ts="$(date +%s)"
cp "$FILE" "$FILE.bak_$ts"

echo "🩹 Patching $FILE to guarantee log creation + hard redirect..."

# 1) Force LOG to be an absolute path in repo root
perl -i -pe 's/^LOG="[^"]*"/LOG="'$ROOT'\/.verify_web_3000.log"/ if $. < 80' "$FILE"

# 2) Insert "touch/truncate log" right after LOG definition (idempotent)
perl -0777 -i -pe 's/(LOG="[^"]+"\n)/$1\n# force-create\/truncate log (root-cause fix)\n: > "$LOG"\n/s' "$FILE"

# 3) Replace common dev launch patterns with a guaranteed redirect
#    We target lines that background a dev command and assign PID.
perl -i -pe '
  if (/^\s*PID=\$!\s*$/) { $seen_pid=1; }
  if (/npm.*run.*dev.*&/ && !$done) {
    $_ = qq{bash -lc "cd web && npm run dev" >"\$LOG" 2>&1 &\n};
    $done=1;
  }
' "$FILE"

echo "✅ Patched: $FILE"
echo
echo "== Show key lines =="
grep -nE 'LOG=|: > "\$LOG"|npm run dev|bash -lc' "$FILE" || true
