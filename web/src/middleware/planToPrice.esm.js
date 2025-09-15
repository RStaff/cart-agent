const PRICE_MAP = Object.freeze({
  starter: (process.env.STRIPE_PRICE_STARTER || "").trim(),
  pro:     (process.env.STRIPE_PRICE_PRO || "").trim(),
  scale:   (process.env.STRIPE_PRICE_SCALE || "").trim(),
});
const ALLOWED_PLANS = Object.freeze(["starter","pro","scale"]);

export default function planToPrice(req, res, next) {
  // Affect only POSTs and not the status probe
  if (req.method !== "POST") return next();
  if (req.path && req.path.includes("_status")) return next();

  try {
    const b = req.body ?? {};
    // Respect explicit priceId if provided
    if (typeof b.priceId === "string" && b.priceId.trim()) return next();

    const plan = String(b.plan || "").toLowerCase();
    if (!plan) return res.status(400).json({ ok:false, code:"plan_required", message:"Field 'plan' is required." });
    if (!ALLOWED_PLANS.includes(plan)) {
      return res.status(400).json({ ok:false, code:"invalid_plan", message:`Plan must be one of ${ALLOWED_PLANS.join(", ")}` });
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return res.status(400).json({ ok:false, code:"price_not_configured", message:`No Stripe price configured for '${plan}'`, plan });
    }

    req.body = { ...b, priceId };
    next();
  } catch (err) {
    next(err);
  }
}
