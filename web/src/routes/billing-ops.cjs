const express = require("express");
const Stripe = require("stripe");
const router = express.Router();

router.post("/portal", async (req, res) => {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return res.status(500).json({ error: "stripe_key_missing" });
    const stripe = new Stripe(key);

    const { customerId, email, return_url } = req.body || {};
    let customer = customerId;

    if (!customer && email) {
      const found = await stripe.customers.list({ email, limit: 1 });
      customer = (found && found.data && found.data[0] && found.data[0].id) || null;
      if (!customer) {
        const created = await stripe.customers.create({ email });
        customer = created.id;
      }
    }

    if (!customer) return res.status(400).json({ error: "missing_customer_or_email" });

    const appUrl = process.env.APP_URL || "https://abando.ai";
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: return_url || appUrl + "/dashboard"
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("[portal]", e);
    res.status(500).json({ error: "portal_failed" });
  }
});

router.post("/admin/provision", async (req, res) => {
  try {
    const adminKey = process.env.ADMIN_API_KEY || "";
    const rawAuth = (req.headers["x-admin-key"] || req.headers["authorization"] || "");
    const hdr = typeof rawAuth === "string" ? rawAuth.replace(/^Bearer\s+/i,"").trim() : "";
    if (!adminKey || hdr !== adminKey) return res.status(403).json({ error: "forbidden" });

    const { email, plan="pro", tokens=1000 } = req.body || {};
    if (!email) return res.status(400).json({ error: "missing_email" });

    res.json({ ok:true, email, plan, tokensProvisioned: tokens });
  } catch (e) {
    console.error("[admin/provision]", e);
    res.status(500).json({ error: "provision_failed" });
  }
});

router.get("/usage/me", async (req, res) => {
  try {
    const email = (req.headers["x-user-email"] || req.query.email || "");
    res.json({
      ok: true,
      email: email || null,
      plan: "trial",
      tokensRemaining: 100
    });
  } catch (e) {
    console.error("[usage/me]", e);
    res.status(500).json({ error: "usage_failed" });
  }
});

module.exports = router;
