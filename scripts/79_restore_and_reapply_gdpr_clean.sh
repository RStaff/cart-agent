#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "== Finding latest backup that parses =="
mapfile -t BAKS < <(ls -1t web/src/index.js.bak.* 2>/dev/null || true)
if [ "${#BAKS[@]}" -eq 0 ]; then
  echo "❌ No backups found (web/src/index.js.bak.*)."
  exit 1
fi

GOOD=""
for b in "${BAKS[@]}"; do
  if node --check "$b" >/dev/null 2>&1; then
    GOOD="$b"
    break
  fi
done

if [ -z "$GOOD" ]; then
  echo "❌ No backup passed 'node --check'."
  echo "   Next step would be to print lines 70-110 and fix braces, but let's not yet."
  exit 1
fi

echo "✅ Using backup: $GOOD"
TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "$FILE.pre_restore.$TS"
cp -v "$GOOD" "$FILE"

echo
echo "== Re-applying ONE clean GDPR block (remove all existing /api/webhooks/gdpr handlers first) =="
python3 - <<'PY'
from pathlib import Path
import re
FILE = Path("web/src/index.js")
s = FILE.read_text(encoding="utf-8")

# 1) Remove any previous marker blocks (cleanly)
s = re.sub(r'^[ \t]*/\*\s*ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/[\s\S]*?^[ \t]*/\*\s*END_ABANDO_GDPR_WEBHOOK_ROUTE\s*\*/\s*\n', '', s, flags=re.M)

# 2) Remove any orphaned older marker blocks you used earlier
s = re.sub(r'^[ \t]*/\*\s*ABANDO_GDPR_ROUTE_ONCE\s*\*/[\s\S]*?^[ \t]*/\*\s*/ABANDO_GDPR_ROUTE_ONCE\s*\*/\s*\n', '', s, flags=re.M)

# 3) Remove any direct handlers for the path (get/post/head/all/use) to avoid collisions
s = re.sub(r'^\s*app\.(get|post|head|all|use)\(\s*[\'"]/api/webhooks/gdpr[\'"][\s\S]*?\);\s*\n', '', s, flags=re.M)

# 4) Ensure crypto import exists (prefer existing node:crypto imports; only add if missing)
if not re.search(r'^\s*import\s+crypto\s+from\s+[\'"]crypto[\'"]\s*;?\s*$', s, flags=re.M):
    # if there is at least one import line, insert after the first import line
    s = re.sub(r'^(import[^\n]*\n)', r'\1import crypto from "crypto";\n', s, count=1, flags=re.M)

gdpr_block = r'''/* ABANDO_GDPR_WEBHOOK_ROUTE */
/**
 * Shopify GDPR webhooks:
 * - respond 405 for non-POST
 * - respond 401 for missing/invalid HMAC on POST
 * - respond 200 only for valid POST
 */
app.all("/api/webhooks/gdpr", (req, res, next) => {
  res.set("X-Abando-GDPR-Guard", "1"); // prove THIS handler is active
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  return next();
});

app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (req, res) => {
  try {
    const secret =
      process.env.SHOPIFY_API_SECRET ||
      process.env.SHOPIFY_API_SECRET_KEY ||
      process.env.SHOPIFY_SECRET ||
      "";

    const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();

    if (!secret || !hmacHeader) return res.status(401).send("Unauthorized");

    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(hmacHeader, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).send("Unauthorized");
    }

    return res.status(200).send("ok");
  } catch (_e) {
    return res.status(401).send("Unauthorized");
  }
});
/* END_ABANDO_GDPR_WEBHOOK_ROUTE */'''

# Insert immediately after `const app = express();`
m = re.search(r'^\s*(const|let|var)\s+app\s*=\s*express\(\)\s*;?\s*$', s, flags=re.M)
if not m:
    raise SystemExit("❌ Could not find `const app = express()` to insert after.")
idx = m.end()
s = s[:idx] + "\n\n" + gdpr_block + "\n\n" + s[idx:]

FILE.write_text(s, encoding="utf-8")
print("✅ Restored + reinserted a single clean GDPR route block.")
PY

echo
echo "== Sanity checks =="
node --check "$FILE"
echo "✅ node --check passed"

echo
echo "== Confirm only one block + handlers =="
python3 - <<'PY'
from pathlib import Path
s = Path("web/src/index.js").read_text(encoding="utf-8")
print("ABANDO_GDPR_WEBHOOK_ROUTE =", s.count("ABANDO_GDPR_WEBHOOK_ROUTE"))
print("END_ABANDO_GDPR_WEBHOOK_ROUTE =", s.count("END_ABANDO_GDPR_WEBHOOK_ROUTE"))
PY

rg -n 'app\.(get|post|head|all|use)\("/api/webhooks/gdpr"|X-Abando-GDPR-Guard|ABANDO_GDPR_WEBHOOK_ROUTE' web/src/index.js || true

echo
echo "✅ Done. Now restart: shopify app dev"
