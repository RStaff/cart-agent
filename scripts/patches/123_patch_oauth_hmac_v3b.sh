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

# Find the existing function block by name (regardless of signature formatting)
pattern = r"function\s+verifyShopifyHmac\s*\([^)]*\)\s*\{.*?\n\}"
m = re.search(pattern, s, flags=re.S)
if not m:
  print("✗ could not find function verifyShopifyHmac(...) { ... } block")
  sys.exit(1)

replacement = r"""function verifyShopifyHmac(reqOrQuery, secret) {
  // Shopify OAuth callback HMAC verification (hex)
  // Accepts either:
  //  - Express req (preferred; uses raw querystring via req.originalUrl)
  //  - A plain query object (fallback; uses RFC3986 encoding)
  try {
    if (!secret) return false;

    // Preferred path: we were passed an Express req
    const looksLikeReq =
      reqOrQuery &&
      typeof reqOrQuery === "object" &&
      (typeof reqOrQuery.originalUrl === "string" || typeof reqOrQuery.url === "string");

    let hmac = "";
    let message = "";

    if (looksLikeReq) {
      const req = reqOrQuery;
      const host = req.headers?.host || "localhost";
      const url = new URL(req.originalUrl || req.url || "/", `https://${host}`);

      const params = new URLSearchParams(url.searchParams);
      hmac = String(params.get("hmac") || "");
      params.delete("hmac");
      params.delete("signature");

      const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
      message = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    } else {
      // Fallback path: we were passed a plain query object
      const query = (reqOrQuery && typeof reqOrQuery === "object") ? reqOrQuery : {};
      const { hmac: qHmac, signature, ...params } = query || {};
      hmac = String(qHmac || "");

      const keys = Object.keys(params).sort();
      message = keys
        .map((k) => {
          const v = params[k];
          if (Array.isArray(v)) {
            return v.map((vv) => `${encodeURIComponent(k)}=${encodeURIComponent(String(vv))}`).join("&");
          }
          return `${encodeURIComponent(k)}=${encodeURIComponent(String(v ?? ""))}`;
        })
        .filter(Boolean)
        .join("&");
    }

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
p.write_text(s2, encoding="utf-8")
print("✓ patched verifyShopifyHmac to accept req OR query (no callsite edits needed)")
PY

echo "=== compile check ==="
node -c "$FILE" && echo "✓ node -c ok"

echo ""
echo "=== occurrences ==="
grep -n "verifyShopifyHmac" "$FILE" | head -n 20 || true

echo ""
echo "✓ patch complete (backup: ${FILE}.bak_${TS})"
