#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

STAMP="$(date +%s)"
BAK="${FILE}.bak_${STAMP}"
cp "$FILE" "$BAK"
echo "🧾 Backup: $BAK"

# 1) Ensure required imports exist (fs/path/crypto)
# - crypto usually already exists for HMAC verification; if not, we add it.
# - we’ll add fs/path in a safe way.
perl -0777 -i -pe '
  my $s = $_;

  # Add fs/path imports if missing
  if ($s !~ /require\(\"fs\"\)/ && $s !~ /from \"fs\"/ && $s !~ /from '\''fs'\''/) {
    # Insert after first block of requires if possible
    if ($s =~ /(^\s*(?:const|var|let)\s+.*?require\(.*?\);\s*\n)/m) {
      $s =~ s/(^\s*(?:const|var|let)\s+.*?require\(.*?\);\s*\n)/$1const fs = require("fs");\nconst path = require("path");\n/m;
    } else {
      $s = "const fs = require(\"fs\");\nconst path = require(\"path\");\n" . $s;
    }
  }

  # Add crypto import if missing (we use it for fingerprinting the secret deterministically without revealing it)
  if ($s !~ /require\(\"crypto\"\)/ && $s !~ /from \"crypto\"/ && $s !~ /from '\''crypto'\''/) {
    if ($s =~ /(^\s*const\s+fs\s*=\s*require\(\"fs\"\);\s*\nconst\s+path\s*=\s*require\(\"path\"\);\s*\n)/m) {
      $s =~ s/(^\s*const\s+fs\s*=\s*require\(\"fs\"\);\s*\nconst\s+path\s*=\s*require\(\"path\"\);\s*\n)/$1const crypto = require("crypto");\n/m;
    } else {
      # Insert near top
      $s = "const crypto = require(\"crypto\");\n" . $s;
    }
  }

  $_ = $s;
' "$FILE"

# 2) Insert helper functions (appendInbox + safe env + secret fingerprint)
# We’ll insert once, right after router creation OR near top if router creation not found.
perl -0777 -i -pe '
  my $s = $_;

  my $helper = qq{

// =======================
// Abando Event Inbox (JSONL)
// Toggle with: ABANDO_EVENT_INBOX=1
// Output file: web/.abando_webhook_inbox.jsonl (override with ABANDO_EVENT_INBOX_PATH)
// =======================
function abandoInboxEnabled() {
  return String(process.env.ABANDO_EVENT_INBOX || "") === "1";
}
function abandoInboxPath() {
  return process.env.ABANDO_EVENT_INBOX_PATH
    ? String(process.env.ABANDO_EVENT_INBOX_PATH)
    : path.join(process.cwd(), "web", ".abando_webhook_inbox.jsonl");
}
function fpSecret(secret) {
  try {
    if (!secret) return null;
    return crypto.createHash("sha256").update(String(secret)).digest("hex").slice(0, 12);
  } catch (e) {
    return null;
  }
}
function appendInbox(lineObj) {
  if (!abandoInboxEnabled()) return;
  try {
    const p = abandoInboxPath();
    const dir = path.dirname(p);
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(p, JSON.stringify(lineObj) + "\\n", "utf8");
  } catch (e) {
    // never break webhook handling if inbox write fails
    console.warn("[abando][inbox] append failed:", e && e.message ? e.message : e);
  }
}

};

  # Insert helper if not already present
  if ($s !~ /Abando Event Inbox \(JSONL\)/) {
    # Prefer insertion after router init: const router = ... OR const webhooksRouter = ...
    if ($s =~ /(const\s+(?:router|webhooksRouter)\s*=\s*.*?;\s*\n)/) {
      $s =~ s/(const\s+(?:router|webhooksRouter)\s*=\s*.*?;\s*\n)/$1$helper\n/;
    } else {
      # Fallback near the top (after imports)
      $s =~ s/(\n)(?!.*Abando Event Inbox)/$1$helper\n/s;
    }
  }

  $_ = $s;
' "$FILE"

# 3) Hook into the “real webhook received” log block and append a JSONL record.
# We’ll append right after the log that prints shop/topic/bytes/hmac_ok if present.
# If not found, we’ll also append after the earlier "[webhooks] received POST /api/webhooks" block.
perl -0777 -i -pe '
  my $s = $_;

  # Primary: after the structured log that contains { shop, topic, bytes, has_hmac, hmac_ok, ... }
  if ($s =~ /\[webhooks\]\s*received\s*\{\s*\n\s*shop:\s*.*?\n\s*topic:\s*.*?\n/s && $s !~ /appendInbox\(\{/s) {
    $s =~ s/(\[webhooks\]\s*received\s*\{\s*\n\s*shop:\s*.*?\n\s*topic:\s*.*?\n\s*bytes:\s*.*?\n\s*has_hmac:\s*.*?\n\s*hmac_ok:\s*.*?\n.*?\n\s*\}\s*\);\s*\n)/$1    appendInbox({\n      ts: new Date().toISOString(),\n      shop: shop || null,\n      topic: topic || null,\n      event_id: req.get(\"x-shopify-event-id\") || null,\n      triggered_at: req.get(\"x-shopify-triggered-at\") || null,\n      webhook_id: req.get(\"x-shopify-webhook-id\") || null,\n      bytes: rawBody ? rawBody.length : null,\n      hmac_ok: Boolean(hmacOk),\n      secret_fp: fpSecret(process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || \"\"),\n      route: req.originalUrl || req.url || null\n    });\n/s;
  }

  # Secondary fallback: after the earlier header-presence log if needed
  if ($s !~ /appendInbox\(\{/s && $s =~ /\[webhooks\]\s*received\",?\s*req\.method/s) {
    $s =~ s/(\[webhooks\]\s*received.*?\}\s*\);\s*\n)/$1    appendInbox({\n      ts: new Date().toISOString(),\n      shop: req.get(\"x-shopify-shop-domain\") || null,\n      topic: req.get(\"x-shopify-topic\") || null,\n      event_id: req.get(\"x-shopify-event-id\") || null,\n      triggered_at: req.get(\"x-shopify-triggered-at\") || null,\n      webhook_id: req.get(\"x-shopify-webhook-id\") || null,\n      bytes: (req.headers[\"content-length\"] ? Number(req.headers[\"content-length\"]) : null),\n      hmac_ok: null,\n      secret_fp: fpSecret(process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || \"\"),\n      route: req.originalUrl || req.url || null\n    });\n/s;
  }

  $_ = $s;
' "$FILE"

echo "✅ Patched $FILE"

echo
echo "🔎 Patch proof:"
echo "  rg -n \"Abando Event Inbox|appendInbox\\(\" $FILE"
echo
echo "📌 Enable it for dev:"
echo "  export ABANDO_EVENT_INBOX=1"
echo "  export ABANDO_EVENT_INBOX_PATH=\"$(pwd)/web/.abando_webhook_inbox.jsonl\""
echo
echo "🧪 Then trigger a real webhook (your existing 260 script) and prove file writes:"
echo "  tail -n 5 web/.abando_webhook_inbox.jsonl"
