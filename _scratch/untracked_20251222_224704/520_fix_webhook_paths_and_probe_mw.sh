#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🛠️  Fixing webhook log paths + adding guaranteed probe middleware (no manual edits)"

# --- 1) Normalize web/.env paths (cwd = web/) ---
ENV_FILE="web/.env"
test -f "$ENV_FILE" || { echo "❌ Missing $ENV_FILE"; exit 1; }

cp "$ENV_FILE" "$ENV_FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/.env")
s = p.read_text(encoding="utf-8").splitlines()

def upsert(lines, key, value):
    out=[]
    found=False
    for line in lines:
        if re.match(rf'^\s*{re.escape(key)}\s*=', line):
            out.append(f"{key}={value}")
            found=True
        else:
            out.append(line)
    if not found:
        out.append(f"{key}={value}")
    return out

# Force cwd-safe relative paths (since server cwd is /web)
s = upsert(s, "ABANDO_EVENT_INBOX_PATH", ".abando_webhook_inbox.jsonl")
s = upsert(s, "ABANDO_WEBHOOK_PROBE_PATH", ".abando_webhook_probe.jsonl")

# Ensure inbox is enabled if you rely on it
s = upsert(s, "ABANDO_EVENT_INBOX", "1")

p.write_text("\n".join(s).rstrip() + "\n", encoding="utf-8")
print("✅ Updated web/.env with cwd-safe paths.")
PY

# --- 2) Add app-level probe middleware to guarantee probe writes on every webhook hit ---
INDEX_FILE="web/src/index.js"
test -f "$INDEX_FILE" || { echo "❌ Missing $INDEX_FILE"; exit 1; }
cp "$INDEX_FILE" "$INDEX_FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

BEGIN = "// ABANDO_WEBHOOK_PROBE_MW_BEGIN"
END   = "// ABANDO_WEBHOOK_PROBE_MW_END"

block = r'''
// ABANDO_WEBHOOK_PROBE_MW_BEGIN
// Guaranteed lightweight probe: does NOT read/consume req body, just logs headers + content-length
app.use("/api/webhooks", (req, _res, next) => {
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const out = process.env.ABANDO_WEBHOOK_PROBE_PATH
      ? path.resolve(process.cwd(), process.env.ABANDO_WEBHOOK_PROBE_PATH)
      : path.resolve(process.cwd(), ".abando_webhook_probe.jsonl");

    const line = JSON.stringify({
      ts: new Date().toISOString(),
      stage: "probe_mw",
      method: req.method,
      url: req.originalUrl || req.url || null,
      content_length: req.get("content-length") || null,
      has_topic: !!req.get("x-shopify-topic"),
      has_shop: !!req.get("x-shopify-shop-domain"),
      has_hmac: !!req.get("x-shopify-hmac-sha256"),
      topic: req.get("x-shopify-topic") || null,
      shop: req.get("x-shopify-shop-domain") || null
    });

    fs.appendFileSync(out, line + "\n");
  } catch (_e) {}
  next();
});
// ABANDO_WEBHOOK_PROBE_MW_END
'''.lstrip("\n")

# If already exists, replace it (idempotent)
if BEGIN in s and END in s:
    s = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), block.strip("\n"), s, flags=re.S)
else:
    # Insert right after your existing entry logger END marker if present, else right before app.use("/api/webhooks", webhooksRouter)
    m = re.search(r"// ABANDO_WEBHOOK_ENTRY_LOGGER_END\s*\n", s)
    if m:
        insert_at = m.end()
        s = s[:insert_at] + "\n" + block + "\n" + s[insert_at:]
    else:
        m2 = re.search(r'\napp\.use\("/api/webhooks",\s*webhooksRouter\);\s*\n', s)
        if not m2:
            raise SystemExit("❌ Could not find insertion anchor in web/src/index.js")
        insert_at = m2.start()
        s = s[:insert_at] + "\n" + block + "\n" + s[insert_at:]

p.write_text(s, encoding="utf-8")
print("✅ Inserted ABANDO_WEBHOOK_PROBE_MW into web/src/index.js")
PY

# --- 3) Clean rogue path safely (old $PWD artifact) ---
if test -f "web/\$PWD/web/.abando_webhook_inbox.jsonl"; then
  echo "🧹 Found rogue file: web/\$PWD/web/.abando_webhook_inbox.jsonl"
  mkdir -p web/_trash
  mv "web/\$PWD" "web/_trash/\$PWD_$(date +%s)" || true
  echo "✅ Moved rogue \$PWD directory under web/_trash/"
else
  echo "✅ No rogue \$PWD file found to clean."
fi

# --- 4) Nudge nodemon restart ---
mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true
echo "🔁 Nudged nodemon restart."

echo
echo "NEXT:"
echo "  1) curl -s http://localhost:3000/__abando/debug-env | python3 -m json.tool"
echo "  2) curl -s -i -X POST http://localhost:3000/api/webhooks -H 'content-type: application/json' --data '{\"t\":'\"$(date +%s)\"'}'"
echo "  3) tail -n 5 web/.abando_webhook_probe.jsonl"
