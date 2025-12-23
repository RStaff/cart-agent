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

m = re.search(r"function\s+__abando__write_inbox\s*\([^)]*\)\s*\{", s)
if not m:
    raise SystemExit("❌ Could not find function __abando__write_inbox(...)")

# brace match to end of function
start = m.start()
i = s.find("{", m.end()-1)
depth = 0
end = None
for j in range(i, len(s)):
    if s[j] == "{": depth += 1
    elif s[j] == "}":
        depth -= 1
        if depth == 0:
            end = j + 1
            break
if end is None:
    raise SystemExit("❌ Could not parse braces for __abando__write_inbox")

func = s[start:end]

# Replace the ABANDO_INBOX_FALLBACK block with a cwd-safe version
func2 = re.sub(
    r"\s*// ABANDO_INBOX_FALLBACK_V2[\s\S]*?const target[\s\S]*?\n",
    "\n",
    func
)

inject = r'''
  // ABANDO_INBOX_FALLBACK_V3 (cwd-safe)
  const cwd = process.cwd();
  const repoRoot = cwd.endsWith("/web") ? cwd.slice(0, -4) : cwd;

  const fallback = repoRoot + "/web/.abando_webhook_inbox.jsonl";

  let target =
    String(process.env.ABANDO_EVENT_INBOX_PATH || process.env.ABANDO_EVENT_INBOX || "").trim()
    || fallback;

  // If we're running from /web and env uses "web/...", normalize to avoid "web/web/..."
  if (cwd.endsWith("/web") && target.startsWith("web/")) target = target.slice(4);
'''.strip("\n")

func2 = re.sub(r"\{\s*\n", "{\n" + inject + "\n", func2, count=1)

s2 = s[:start] + func2 + s[end:]
p.write_text(s2, encoding="utf-8")
print("✅ Patched __abando__write_inbox target resolution (cwd-safe, avoids web/web).")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."
