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

debug_block = r'''  // ABANDO_WEBHOOK_FP_DEBUG_BEGIN
  try {
    const crypto = await import("node:crypto");
    const path = await import("node:path");

    const secret = String(process.env.SHOPIFY_API_SECRET || "");
    const fp = crypto.createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12);

    const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || "");
    const resolved = raw ? path.resolve(process.cwd(), raw) : "(none)";

    console.log("[abando][SECRET_FP]", fp);
    console.log("[abando][INBOX_ENABLED]", String(process.env.ABANDO_EVENT_INBOX || ""));
    console.log("[abando][INBOX_PATH] cwd=", process.cwd(), "raw=", raw, "resolved=", resolved);
  } catch (e) {
    console.log("[abando][FP_DEBUG] failed", e?.message || e);
  }
  // ABANDO_WEBHOOK_FP_DEBUG_END
'''

# Match: router.post("/", express.raw(...), async (req,res) => {
pat = re.compile(
    r'(router\.post\(\s*["\']\/["\']\s*,[\s\S]*?async\s*\([\s\S]*?\)\s*=>\s*\{\s*\n)',
    re.M
)

m = pat.search(s)
if not m:
    print("❌ Could not find router.post(\"/\", ... async (...) => { ) to patch.", file=sys.stderr)
    # Helpful hint: show the exact line you discovered
    root = re.search(r'router\.post\(\s*["\']\/["\']', s)
    if root:
        start = max(0, root.start() - 200)
        end = min(len(s), root.start() + 300)
        print("---- nearby ----", file=sys.stderr)
        print(s[start:end], file=sys.stderr)
    sys.exit(2)

insert_at = m.end(1)
s = s[:insert_at] + debug_block + "\n" + s[insert_at:]

FILE.write_text(s, encoding="utf-8")
print(f"✅ Patched {FILE}")
print(f"🧾 Backup: {backup}")
print("ℹ️ Nodemon should auto-restart (Terminal A). If it doesn’t, type: rs in Terminal A.")
