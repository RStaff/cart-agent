#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

# If route already exists, bail
if grep -qE 'app\.post\(\s*["'"'"'`]/api/webhooks["'"'"'`]' "$FILE"; then
  echo "✅ /api/webhooks already exists in $FILE"
  exit 0
fi

# Backup
cp "$FILE" "$FILE.bak_$(date +%Y%m%d_%H%M%S)"

# Verify express is referenced (we need express.raw)
if ! grep -qE '\bexpress\b' "$FILE"; then
  echo "⚠️  Could not find 'express' identifier in $FILE. This patch assumes your file uses express()."
fi

# Insert right after: const app = express();
TMP="$(mktemp)"
awk '
  BEGIN { inserted=0 }
  {
    print $0
    if (!inserted && $0 ~ /const[[:space:]]+app[[:space:]]*=[[:space:]]*express\(\)[[:space:]]*;/) {
      print ""
      print "// [ABANDO] Shopify webhooks endpoint (required for CLI trigger + real events)"
      print "// IMPORTANT: use raw body for signature verification (HMAC) in real implementation"
      print "app.post(\"/api/webhooks\", express.raw({ type: \"*/*\" }), async (req, res) => {"
      print "  try {"
      print "    console.log(\"[webhooks] received\", {"
      print "      bytes: req.body ? req.body.length : 0,"
      print "      topic: req.headers[\"x-shopify-topic\"],"
      print "      shop: req.headers[\"x-shopify-shop-domain\"],"
      print "    });"
      print "    return res.status(200).send(\"ok\");"
      print "  } catch (e) {"
      print "    console.error(\"[webhooks] error\", e);"
      print "    return res.status(500).send(\"error\");"
      print "  }"
      print "});"
      print ""
      inserted=1
    }
  }
  END {
    if (!inserted) {
      print "" > "/dev/stderr"
      print "❌ Did not find line: const app = express(); in web/src/index.js" > "/dev/stderr"
      print "   Open the file and tell me the exact line where app is created." > "/dev/stderr"
      exit 2
    }
  }
' "$FILE" > "$TMP"

mv "$TMP" "$FILE"

echo "✅ Patched: $FILE"
echo
echo "Sanity:"
grep -nE '/api/webhooks|express\.raw' "$FILE" || true
