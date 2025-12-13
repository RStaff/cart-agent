/**
 * Minimal shop context extraction for gating + metrics.
 * Upgrade later to enforce signed Shopify sessions.
 */
export function getShopFromReq(req) {
  // Preferred: explicit header from your proxy or auth middleware
  const h = req.get("x-shopify-shop-domain") || req.get("x-shop-domain");
  if (h) return String(h).trim();

  // Fallback: query param
  const q = req.query && (req.query.shop || req.query.shopDomain);
  if (q) return String(q).trim();

  // Fallback: referer parsing (last resort)
  const ref = req.get("referer") || "";
  const m = ref.match(/[?&]shop=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);

  return null;
}
