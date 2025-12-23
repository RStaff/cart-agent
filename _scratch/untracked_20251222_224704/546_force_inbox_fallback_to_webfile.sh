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

# We want __abando__write_inbox to ALWAYS resolve a target file.
# Strategy:
#  - find the function __abando__write_inbox(...) { ... }
#  - inside it, replace/insert a "target path" resolution that falls back to web/.abando_webhook_inbox.jsonl

m = re.search(r"function\s+__abando__write_inbox\s*\([^)]*\)\s*\{", s)
if not m:
    raise SystemExit("❌ Could not find function __abando__write_inbox(...) in webhooks.js")

start = m.start()
# naive brace matching to find end of function body
i = s.find("{", m.end()-1)
depth = 0
end = None
for j in range(i, len(s)):
    if s[j] == "{":
        depth += 1
    elif s[j] == "}":
        depth -= 1
        if depth == 0:
            end = j + 1
            break
if end is None:
    raise SystemExit("❌ Could not parse braces for __abando__write_inbox body")

func = s[start:end]

# Insert a robust "target" near top of function body (right after {)
injection = r'''
  // ABANDO_INBOX_FALLBACK_V1
  const path = (await import("node:path")).default;
  const fs = (await import("node:fs")).default;
  const fallback = path.join(process.cwd(), "web", ".abando_webhook_inbox.jsonl");
  const target =
    String(process.env.ABANDO_EVENT_INBOX_PATH || process.env.ABANDO_EVENT_INBOX || "").trim()
    || fallback;
'''.strip("\n")

# Remove any previous fallback injection block if present (idempotent)
func2 = re.sub(r"\s*// ABANDO_INBOX_FALLBACK_V1[\s\S]*?const target[\s\S]*?;\s*\n", "\n", func)

# Place injection right after the opening brace
func2 = re.sub(r"\{\s*\n", "{\n" + injection + "\n", func2, count=1)

# Now ensure writes use `target` (common patterns: writeFileSync(PATH,...), appendFileSync(PATH,...))
func2 = re.sub(r"appendFileSync\(\s*([A-Za-z0-9_$.\[\]\"']+)\s*,", "appendFileSync(target,", func2)
func2 = re.sub(r"writeFileSync\(\s*([A-Za-z0-9_$.\[\]\"']+)\s*,", "writeFileSync(target,", func2)

s2 = s[:start] + func2 + s[end:]
p.write_text(s2, encoding="utf-8")
print("✅ Patched __abando__write_inbox(): force inbox target fallback to web/.abando_webhook_inbox.jsonl")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."
