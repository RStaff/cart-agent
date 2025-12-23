#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# 1) Remove the bad injected block that contains 'await import'
s2 = re.sub(
    r"\n?\s*// ABANDO_INBOX_FALLBACK_V1[\s\S]*?const target[\s\S]*?\n",
    "\n",
    s,
    count=1
)

# 2) Find __abando__write_inbox and inject a SAFE fallback (no await/import)
m = re.search(r"function\s+__abando__write_inbox\s*\([^)]*\)\s*\{", s2)
if not m:
    raise SystemExit("❌ Could not find function __abando__write_inbox(...)")

# brace match to end of function
start = m.start()
i = s2.find("{", m.end()-1)
depth = 0
end = None
for j in range(i, len(s2)):
    if s2[j] == "{": depth += 1
    elif s2[j] == "}":
        depth -= 1
        if depth == 0:
            end = j + 1
            break
if end is None:
    raise SystemExit("❌ Could not parse braces for __abando__write_inbox")

func = s2[start:end]

inject = r'''
  // ABANDO_INBOX_FALLBACK_V2 (no await/import)
  const fallback = process.cwd() + "/web/.abando_webhook_inbox.jsonl";
  const target =
    String(process.env.ABANDO_EVENT_INBOX_PATH || process.env.ABANDO_EVENT_INBOX || "").trim()
    || fallback;
'''.strip("\n")

# make idempotent: remove older V2 if rerun
func = re.sub(r"\s*// ABANDO_INBOX_FALLBACK_V2[\s\S]*?const target[\s\S]*?;\s*\n", "\n", func)

# insert right after opening brace
func = re.sub(r"\{\s*\n", "{\n" + inject + "\n", func, count=1)

# ensure file writes use `target`
func = re.sub(r"appendFileSync\(\s*([A-Za-z0-9_$.\[\]\"']+)\s*,", "appendFileSync(target,", func)
func = re.sub(r"writeFileSync\(\s*([A-Za-z0-9_$.\[\]\"']+)\s*,", "writeFileSync(target,", func)

s3 = s2[:start] + func + s2[end:]
p.write_text(s3, encoding="utf-8")
print("✅ Repaired __abando__write_inbox fallback (removed await/import; uses cwd-based fallback).")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."
