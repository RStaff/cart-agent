export default function planToPrice(req, res, next) {
  try {
    const b = req.body || {};
    if (typeof b.priceId === "string" && b.priceId.trim()) return next();

    const plan = String(b.plan || "").toLowerCase();
    const map = {
      starter: (process.env.STRIPE_PRICE_STARTER || "").trim(),
      pro:     (process.env.STRIPE_PRICE_PRO || "").trim(),
      scale:   (process.env.STRIPE_PRICE_SCALE || "").trim(),
    };

    if (!plan) return res.status(400).json({ error: "plan_required" });

    const priceId = map[plan];
    if (!priceId) return res.status(400).json({ error: "price_not_configured", plan });

    req.body = { ...(req.body || {}), priceId };
    return next();
  } catch (e) {
    return next(e);
  }
}
