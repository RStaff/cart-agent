#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🧼 Canonicalizing webhook inbox writer (single source of truth)..."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")
bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# 1) Ensure __abando__write_inbox writes REAL newlines (not \\n or broken literals)
# Normalize any appendFileSync(target, ... + "\\n") to ... + "\n"
s = re.sub(r'appendFileSync\((\s*target\s*,\s*[^;]*?)\s*\+\s*"(?:\\\\n)"\s*\)',
           r'appendFileSync(\1 + "\\n")', s)

# 2) Force __abando__write_inbox target resolution to ALWAYS point to repoRoot/web/.abando_webhook_inbox.jsonl
# We will patch the fallback/target block inside __abando__write_inbox if present.
pattern = re.compile(r'(function\s+__abando__write_inbox\s*\(\s*stage\s*,\s*obj\s*\)\s*\{[\s\S]*?)(const\s+cwd\s*=\s*process\.cwd\(\);\s*[\s\S]*?)(const\s+base\s*=)', re.M)
m = pattern.search(s)
if not m:
    raise SystemExit("❌ Could not locate __abando__write_inbox() body to patch.")

prefix = m.group(1)
mid = m.group(2)
suffix_start = m.group(3)

# Replace the cwd/repoRoot/fallback/target normalization with a simpler canonical rule:
replacement_mid = r'''const path = require("node:path");
  const cwd = process.cwd();
  const repoRoot = cwd.endsWith(path.sep + "web") ? cwd.slice(0, -4) : cwd;

  // Canonical target: <repoRoot>/web/.abando_webhook_inbox.jsonl
  const canonical = path.resolve(repoRoot, "web/.abando_webhook_inbox.jsonl");

  // Allow override ONLY if env provides an absolute path.
  const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || "").trim();
  const target = (raw && path.isAbsolute(raw)) ? raw : canonical;
'''

s = pattern.sub(r'\1' + replacement_mid + r'\3', s, count=1)

# 3) Disable ALL direct out-writers that bypass __abando__write_inbox.
# Comment out appendFileSync(out, ...) inside router probe blocks.
s = re.sub(r'^[ \t]*fs\.appendFileSync\(\s*out\s*,\s*([^)]+)\);\s*$',
           r'// [ABANDO] bypass disabled (use __abando__write_inbox): fs.appendFileSync(out, \1);',
           s, flags=re.M)

# 4) Ensure the webhook handler uses __abando__write_inbox("handler_ok_send", ...) (already present, keep it)
if '__abando__write_inbox("handler_ok_send"' not in s:
    raise SystemExit("❌ Expected handler_ok_send call via __abando__write_inbox not found.")

p.write_text(s, encoding="utf-8")
print(f"✅ Patched. Backup: {bak.name}")
PY

echo "🔎 node --check..."
node --check "$FILE"
echo "✅ node --check passed."

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."
