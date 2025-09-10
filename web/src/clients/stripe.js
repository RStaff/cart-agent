import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
let _stripe = null;

if (!key) {
  console.warn("[billing] STRIPE_SECRET_KEY not set — billing endpoints will be disabled.");
} else {
  _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
}

export const stripe = _stripe;        // may be null when not configured
export function ensureStripe(req, res) {
  if (!stripe) {
    return res.status(503).json({
      error: "stripe_not_configured",
      message: "Billing is temporarily unavailable. Contact support or try again later.",
    });
  }
  return null;
}
