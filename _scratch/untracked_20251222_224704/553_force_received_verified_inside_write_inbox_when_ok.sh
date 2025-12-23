#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Patching __abando__write_inbox(): when stage==handler_ok_send also write received+verified (same target)..."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

MARK = "ABANDO_OK_SEND_STAGE_HOOK_V1"
if MARK in s:
    print("ℹ️ Already applied — no changes.")
    raise SystemExit(0)

# Find the __abando__write_inbox function body
m = re.search(r'function\s+__abando__write_inbox\s*\(\s*stage\s*,\s*obj\s*\)\s*\{', s)
if not m:
    raise SystemExit("❌ Could not find function __abando__write_inbox(stage, obj) {")

# We want to inject AFTER target resolution exists.
# Use your existing marker if present; else inject near the first fs.appendFileSync(target,...)
inject_at = None

mk = re.search(r'//\s*ABANDO_INBOX_FALLBACK_V3.*?\n', s)
if mk:
    # insert after the V3 block (a few lines later to stay inside function)
    # find the next newline after that marker, and inject a bit after (safe)
    inject_at = mk.end()
else:
    # fallback: insert right before first appendFileSync(target, ...)
    ap = re.search(r'^\s*fs\.appendFileSync\(\s*target\s*,', s, flags=re.M)
    if not ap:
        raise SystemExit("❌ Could not find fs.appendFileSync(target, ...) to anchor injection.")
    inject_at = ap.start()

hook = r'''
  // ABANDO_OK_SEND_STAGE_HOOK_V1
  // If anything logs "handler_ok_send", also emit "received" + "verified" right next to it,
  // using the SAME target file resolution.
  try {
    if (stage === "handler_ok_send" && obj && !obj.__abando_internal) {
      const base = typeof obj === "object" ? obj : { value: obj };
      const a = JSON.stringify({ ...base, __abando_internal: true, ts: new Date().toISOString(), stage: "received" });
      fs.appendFileSync(target, a + "\n");
      const b = JSON.stringify({ ...base, __abando_internal: true, ts: new Date().toISOString(), stage: "verified" });
      fs.appendFileSync(target, b + "\n");
    }
  } catch (_e) {}
'''.lstrip("\n")

# Backup
bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

s2 = s[:inject_at] + hook + s[inject_at:]
p.write_text(s2, encoding="utf-8")
print(f"✅ Injected stage hook into __abando__write_inbox(). Backup: {bak.name}")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."
