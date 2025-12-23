#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="$FILE.bak_$(date +%s)"
cp "$FILE" "$BK"
echo "🧾 Backup: $BK"

# We expect ESM file; use imports not require
# Ensure we have these imports at the very top:
# import fs from "fs";
# import crypto from "crypto";
# import path from "path";

perl -0777 -i -pe '
  my $s = $_;

  # If file starts with require("fs") or require("crypto"), replace with ESM imports
  $s =~ s/^\s*const\s+fs\s*=\s*require\(\"fs\"\);\s*\n//m;
  $s =~ s/^\s*const\s+crypto\s*=\s*require\(\"crypto\"\);\s*\n//m;
  $s =~ s/^\s*const\s+path\s*=\s*require\(\"path\"\);\s*\n//m;

  # Ensure imports exist
  if ($s !~ /^import\s+fs\s+from\s+\"fs\";/m) {
    $s = "import fs from \"fs\";\n" . $s;
  }
  if ($s !~ /^import\s+crypto\s+from\s+\"crypto\";/m) {
    $s = "import crypto from \"crypto\";\n" . $s;
  }
  if ($s !~ /^import\s+path\s+from\s+\"path\";/m) {
    $s = "import path from \"path\";\n" . $s;
  }

  # Add helper: payload fingerprint (sha256 first 12 chars)
  if ($s !~ /function\s+fpPayload\(/) {
    $s =~ s/(function\s+appendInbox\s*\([^\)]*\)\s*\{\s*\n)/$1function fpPayload(buf) {\n  try {\n    return crypto.createHash(\"sha256\").update(buf).digest(\"hex\").slice(0, 12);\n  } catch (e) {\n    return null;\n  }\n}\n\n/s;
  }

  # Patch: where appendInbox is called for the first time (the early write) to include stage + payload_fp,
  # but keep it as "received" with hmac_ok null.
  # We assume there is an appendInbox({ ... route: ... }) block already.
  $s =~ s/appendInbox\s*\(\s*\{\s*\n([^}]*?)\n\s*\}\s*\)\s*;/appendInbox({\n$1\n      stage: \"received\",\n      payload_fp: (typeof rawBody !== \"undefined\" && rawBody ? fpPayload(rawBody) : null),\n    });/s;

  # Add a second appendInbox call AFTER you compute hmacOk / hmac_ok
  # Look for a log block containing hmacOk: true/false or variable named hmacOk/hmac_ok
  # We insert right after the hmac debug print object (or after hmacOk calculation).
  if ($s !~ /stage:\s*\"verified\"/) {
    $s =~ s/(\[webhooks\]\[hmac-debug\][\s\S]*?hmacOk:\s*(true|false)[\s\S]*?\n\s*\}\);\s*\n)/$1    appendInbox({\n      ts: new Date().toISOString(),\n      shop: req.get(\"x-shopify-shop-domain\") || null,\n      topic: req.get(\"x-shopify-topic\") || null,\n      event_id: req.get(\"x-shopify-event-id\") || null,\n      triggered_at: req.get(\"x-shopify-triggered-at\") || null,\n      webhook_id: req.get(\"x-shopify-webhook-id\") || null,\n      bytes: (req.headers[\"content-length\"] ? Number(req.headers[\"content-length\"]) : null),\n      hmac_ok: (typeof hmacOk !== \"undefined\" ? !!hmacOk : (typeof hmac_ok !== \"undefined\" ? !!hmac_ok : null)),\n      secret_fp: fpSecret(process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || \"\"),\n      route: req.originalUrl || req.url || null,\n      stage: \"verified\",\n      payload_fp: (typeof rawBody !== \"undefined\" && rawBody ? fpPayload(rawBody) : null),\n    });\n/s;
  }

  $_ = $s;
' "$FILE"

echo "✅ Patched $FILE"
echo
echo "🔎 Quick proof:"
rg -n "stage: \"received\"|stage: \"verified\"|function fpPayload" "$FILE" || true
