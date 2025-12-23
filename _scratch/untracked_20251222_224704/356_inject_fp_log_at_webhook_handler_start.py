#!/usr/bin/env python3
import re, time, pathlib, sys

FILE = pathlib.Path("web/src/routes/webhooks.js")
if not FILE.exists():
    print(f"❌ Missing {FILE}", file=sys.stderr)
    sys.exit(1)

ts = str(int(time.time()))
backup = FILE.with_suffix(FILE.suffix + f".bak_{ts}")
backup.write_text(FILE.read_text(encoding="utf-8"), encoding="utf-8")
s = FILE.read_text(encoding="utf-8")

# If already patched, exit cleanly
if "ABANDO_WEBHOOK_FP_DEBUG_BEGIN" in s:
    print(f"✅ Already patched: {FILE}")
    print(f"🧾 Backup: {backup}")
    sys.exit(0)

# --- Normalize imports (ESM-safe) ---
# Remove ESM-breaking require("node:path") if present
s = re.sub(r"\n\s*const\s+path\s*=\s*require\(\"node:path\"\);\s*\n", "\n", s)

# Remove any default import 'import path from "node:path";' to avoid dup/conflicts
s = re.sub(r'^\s*import\s+path\s+from\s+"node:path";\s*\n', "", s, flags=re.M)

# Ensure namespace imports exist once near top
imports_block = re.match(r"^((?:\s*import[^\n]*\n)+)", s)
imports = imports_block.group(1) if imports_block else ""
need_path = 'import * as abandoPath from "node:path";\n' not in imports
need_crypto = 'import * as abandoCrypto from "node:crypto";\n' not in imports

to_add = ""
if need_path:
    to_add += 'import * as abandoPath from "node:path";\n'
if need_crypto:
    to_add += 'import * as abandoCrypto from "node:crypto";\n'

if to_add:
    if imports_block:
        s = imports + to_add + s[len(imports):]
    else:
        s = to_add + s

# Refresh imports
imports_block = re.match(r"^((?:\s*import[^\n]*\n)+)", s)
imports = imports_block.group(1) if imports_block else ""

# Helper for secret fp (insert once)
helper = r'''
// ABANDO_SECRET_FP_HELPER_BEGIN
function abandoSecretFp() {
  try {
    const secret = String(process.env.SHOPIFY_API_SECRET || "");
    return abandoCrypto.createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12);
  } catch (e) {
    return "(fp_failed)";
  }
}
// ABANDO_SECRET_FP_HELPER_END

'''
if "ABANDO_SECRET_FP_HELPER_BEGIN" not in s:
    if imports_block:
        s = imports + helper + s[len(imports):]
    else:
        s = helper + s

debug_block = r'''  // ABANDO_WEBHOOK_FP_DEBUG_BEGIN
  try {
    const fp = abandoSecretFp();
    const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || "");
    const resolved = raw ? abandoPath.resolve(process.cwd(), raw) : "(none)";
    console.log("[abando][SECRET_FP]", fp);
    console.log("[abando][INBOX_ENABLED]", String(process.env.ABANDO_EVENT_INBOX || ""));
    console.log("[abando][INBOX_PATH] cwd=", process.cwd(), "raw=", raw, "resolved=", resolved);
  } catch (e) {
    console.log("[abando][FP_DEBUG] failed", e?.message || e);
  }
  // ABANDO_WEBHOOK_FP_DEBUG_END
'''

# --- Inject at start of POST handler ---
# Patterns:
# 1) router.post("/api/webhooks", ... => {  <insert here>
# 2) app.post("/api/webhooks", ... => {     <insert here>
# 3) router.post("/webhooks", ... => {      (mounted under /api)
patterns = [
    re.compile(r'(router|app)\.post\(\s*["\']\/api\/webhooks["\'][\s\S]*?=>\s*\{\s*\n', re.M),
    re.compile(r'(router|app)\.post\(\s*["\']\/webhooks["\'][\s\S]*?=>\s*\{\s*\n', re.M),
    re.compile(r'(router|app)\.post\(\s*["\']\/api\/webhooks["\'][\s\S]*?\)\s*=>\s*\{\s*\n', re.M),
]

for pat in patterns:
    m = pat.search(s)
    if m:
        insert_at = m.end(0)
        s = s[:insert_at] + debug_block + "\n" + s[insert_at:]
        FILE.write_text(s, encoding="utf-8")
        print(f"✅ Patched {FILE}")
        print(f"🧾 Backup: {backup}")
        print("ℹ️ Nodemon should auto-restart (Terminal A). If it doesn’t, type: rs in Terminal A.")
        sys.exit(0)

print("❌ Could not find a POST handler for /api/webhooks (or /webhooks) to patch.", file=sys.stderr)
print("   Next: we’ll locate the route definition with a quick grep.", file=sys.stderr)
sys.exit(2)
