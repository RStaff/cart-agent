#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

python3 - <<'PY'
import re
from pathlib import Path

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

MARKER = "// ABANDO_INBOX_LOGGER_V2"
if MARKER not in s:
  # Insert helper block after the last import line
  lines = s.splitlines(True)
  last_import = -1
  for i, line in enumerate(lines):
    if re.match(r'^\s*import\s', line):
      last_import = i
  insert_at = last_import + 1 if last_import >= 0 else 0

  helper = f'''
{MARKER}
function __abando__fp(str) {{
  try {{
    if (!str) return "NONE";
    return createHmac("sha256", "abando_fp").update(String(str)).digest("hex").slice(0, 12);
  }} catch (_) {{
    return "ERR";
  }}
}}

function __abando__payload_fp(buf) {{
  try {{
    if (!buf) return null;
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf));
    return createHmac("sha256", "abando_payload_fp").update(b).digest("hex").slice(0, 16);
  }} catch (_) {{
    return null;
  }}
}}

function __abando__inbox_path() {{
  try {{
    const rel = process.env.ABANDO_WEBHOOK_INBOX_PATH || ".abando_webhook_inbox.jsonl";
    return path.resolve(process.cwd(), rel);
  }} catch (_) {{
    return ".abando_webhook_inbox.jsonl";
  }}
}}

function __abando__write_inbox(stage, obj) {{
  try {{
    const out = __abando__inbox_path();
    const line = JSON.stringify({{ ts: new Date().toISOString(), stage, ...obj }});
    fs.appendFileSync(out, line + "\\n");
  }} catch (e) {{
    try {{ console.warn("[abando][INBOX_WRITE] failed:", e?.message || e); }} catch (_) {{}}
  }}
}}
'''
  lines.insert(insert_at, helper)
  s = "".join(lines)

# Now patch every `handler_ok_send` return to also write received/verified
# We patch BOTH occurrences of: return res.status(200).send("ok");
pattern = r'return\s+res\.status\(\s*200\s*\)\.send\(\s*["\']ok["\']\s*\)\s*;'

def repl(m):
  block = r'''
      // ABANDO_LOGGING_V2 (forced)
      try {
        const topic = req.get("x-shopify-topic") || req.get("x-shopify-webhook-topic") || "unknown";
        const shop  = req.get("x-shopify-shop-domain") || "unknown";
        const whId  = req.get("x-shopify-webhook-id") || null;
        const trig  = req.get("x-shopify-triggered-at") || null;
        const hmac  = req.get("x-shopify-hmac-sha256") || "";
        const raw   = req.body; // express.raw() => Buffer
        const bytes = raw ? (Buffer.isBuffer(raw) ? raw.length : Buffer.byteLength(String(raw))) : null;

        // log "received"
        __abando__write_inbox("received", {
          route: req.originalUrl || req.url,
          shop, topic,
          event_id: null,
          triggered_at: trig,
          webhook_id: whId,
          bytes,
          hmac_ok: null,
          secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
          payload_fp: null
        });

        // verify
        let ok = false;
        const secret = process.env.SHOPIFY_API_SECRET || "";
        if (secret && hmac && raw) {
          const calc = createHmac("sha256", secret).update(raw).digest("base64");
          try {
            ok = timingSafeEqual(Buffer.from(calc), Buffer.from(hmac));
          } catch (_) {
            ok = (calc === hmac);
          }
        }

        __abando__write_inbox("verified", {
          route: req.originalUrl || req.url,
          shop, topic,
          event_id: null,
          triggered_at: trig,
          webhook_id: whId,
          bytes,
          hmac_ok: ok,
          secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
          payload_fp: __abando__payload_fp(raw)
        });
      } catch (e) {
        try { console.warn("[abando][LOGGING_V2] failed:", e?.message || e); } catch (_) {}
      }

      return res.status(200).send("ok");
'''
  return block

new_s, n = re.subn(pattern, repl, s, flags=re.M)
if n == 0:
  raise SystemExit("❌ Did not find `return res.status(200).send(\"ok\")` to patch. The handler may have changed.")
p.write_text(new_s, encoding="utf-8")
print(f"✅ Patched {n} ok-return(s) to also log received+verified.")
PY

echo "🔎 ESM import-check $FILE..."
node --input-type=module -e "import('file://' + process.cwd() + '/$FILE').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."
