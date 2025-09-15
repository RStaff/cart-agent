export default function planToPrice(req, res, next) {
  try {
    // Only enforce on POSTs to avoid interfering with GET _status, etc.
    if (req.method !== "POST") return next();
    if (req.path && req.path.includes("_status")) return next();

    const b = req.body || {};
    if (typeof b.priceId === "string" && b.priceId.trim()) return next();

    const plan = String(b.plan || "").toLowerCase();
    if (!plan) return res.status(400).json({ ok:false, code:"plan_required", message:"plan required" });

    const map = {
      starter: (process.env.STRIPE_PRICE_STARTER || "").trim(),
      pro:     (process.env.STRIPE_PRICE_PRO || "").trim(),
      scale:   (process.env.STRIPE_PRICE_SCALE || "").trim(),
    };

    const priceId = map[plan];
    if (!priceId) {
      return res.status(400).json({
        ok:false, code:"price_not_configured",
        message:`No Stripe price configured for '${plan}'`, plan
      });
    }

    req.body = { ...(req.body || {}), priceId };
    return next();
  } catch (e) {
    return next(e);
  }
}
