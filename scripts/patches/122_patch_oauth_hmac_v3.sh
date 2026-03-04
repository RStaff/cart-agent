#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "✗ missing $FILE"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak_${TS}"

python3 - <<'PY'
import re, pathlib, sys
p = pathlib.Path("web/src/index.js")
s = p.read_text(encoding="utf-8")

# Replace verifyShopifyHmac(...) function with a req-based version using raw querystring + RFC3986 encoding
pattern = r"function\s+verifyShopifyHmac\s*\(\s*query\s*,\s*secret\s*\)\s*\{.*?\n\}"
m = re.search(pattern, s, flags=re.S)
if not m:
  print("✗ could not find function verifyShopifyHmac(query, secret) block")
  sys.exit(1)

replacement = """function verifyShopifyHmac(req, secret) {
  // Shopify OAuth callback HMAC verification (hex)
  // Uses raw querystring (req.originalUrl) + RFC3986 encoding, sorted keys, excludes hmac/signature.
  try {
    if (!secret) return false;

    const host = req.headers.host || "localhost";
    const url = new URL(req.originalUrl || req.url || "/", `https://${host}`);

    const params = new URLSearchParams(url.searchParams);
    const hmac = String(params.get("hmac") || "");
    params.delete("hmac");
    params.delete("signature");

    const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));

    const message = entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");

    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(hmac, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}"""

s2 = re.sub(pattern, replacement, s, flags=re.S)

# Update callback call site: verifyShopifyHmac(req.query, secret) -> verifyShopifyHmac(req, secret)
s3, n = re.subn(r"verifyShopifyHmac\s*\(\s*req\.query\s*,\s*secret\s*\)", "verifyShopifyHmac(req, secret)", s2)
if n == 0:
  print("✗ did not find verifyShopifyHmac(req.query, secret) call site to update")
  sys.exit(1)

p.write_text(s3, encoding="utf-8")
print("✓ patched verifyShopifyHmac + call site")
PY

echo "=== compile check ==="
node -c "$FILE" && echo "✓ node -c ok"

echo ""
echo "=== sanity grep ==="
grep -n "function verifyShopifyHmac(req, secret)" "$FILE" | head -n 3
grep -n "verifyShopifyHmac(req, secret)" "$FILE" | head -n 10

echo ""
echo "✓ patch complete (backup created: ${FILE}.bak_${TS})"
