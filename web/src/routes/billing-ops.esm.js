import express from "express";
import Stripe from "stripe";

/** tiny in-memory rate limit per IP (burst 10/min) */
const __rl = new Map();
function allowIp(req){
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown") + "";
  const now = Date.now();
  const slot = Math.floor(now / 60000); // per-minute bucket
  const state = __rl.get(ip) || {slot, count:0};
  if (state.slot !== slot) { state.slot = slot; state.count = 0; }
  state.count++;
  __rl.set(ip, state);
  return state.count <= 10;
}


function getAdminHeader(req) {
  // Node makes headers lower-case already, but normalize defensively
  const raw = (req.headers["x-admin-key"] ?? req.headers["X-Admin-Key"] ?? req.headers["authorization"] ?? req.headers["Authorization"] ?? "");
  const s = (typeof raw === "string" ? raw : String(raw)).replace(/^Bearer\s+/i, "").trim();
  return s;
}
function jsonError(res, code, error, extra){
  res.status(code).json(Object.assign({ error }, extra || {}));
}

const router = express.Router();

router.post("/admin/ping", (req, res) => {
  if (!allowIp(req)) return jsonError(res, 429, "rate_limited");
  const adminKey = (process.env.ADMIN_API_KEY || "").trim();
  const hdr = getAdminHeader(req);
  res.json({
    ok: true,
    adminKeyPresent: adminKey.length > 0,
    headerPresent: hdr.length > 0,
    lengths: { env: adminKey.length, header: hdr.length },
    match: adminKey.length > 0 && hdr === adminKey
  });
});
router.all("/admin/ping", (_req, res) => res.status(405).json({ error: "method_not_allowed" }));


router.post("/portal", async (req, res) => {
  try {
    if (!allowIp(req)) return jsonError(res, 429, "rate_limited");
    const key = (process.env.STRIPE_SECRET_KEY || "").trim();
    if (!key) return jsonError(res, 500, "stripe_key_missing");
    const stripe = new Stripe(key);

    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const return_url = typeof body.return_url === "string" ? body.return_url.trim() : "";

    let customer = customerId;
    if (!customer && email) {
      const found = await stripe.customers.list({ email, limit: 1 });
      customer = found?.data?.[0]?.id || null;
      if (!customer) {
        const created = await stripe.customers.create({ email });
        customer = created.id;
      }
    }
    if (!customer) return jsonError(res, 400, "missing_customer_or_email");

    const appUrl = (process.env.APP_URL || "https://abando.ai").trim();
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: return_url || appUrl + "/dashboard"
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("[ops/portal]", e);
    jsonError(res, 500, "portal_failed");
  }
});
router.all("/portal", (_req, res) => res.status(405).json({ error: "method_not_allowed" }));


router.post("/admin/provision", async (req, res) => {
  try {
    if (!allowIp(req)) return jsonError(res, 429, "rate_limited");
    const adminKey = (process.env.ADMIN_API_KEY || "").trim();
    const hdr = getAdminHeader(req);
    if (!adminKey || hdr !== adminKey) return jsonError(res, 403, "forbidden");

    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const email = (typeof body.email === "string" && body.email.trim()) || "";
    const plan = (typeof body.plan === "string" && body.plan.trim()) || "pro";
    const tokens = Number.isFinite(body.tokens) ? body.tokens : 1000;

    if (!email) return jsonError(res, 400, "missing_email");
    // Stubbed provisioning payload (drop-in spot for your DB upsert)
    res.json({ ok: true, email, plan, tokensProvisioned: tokens });
  } catch (e) {
    console.error("[ops/admin/provision]", e);
    jsonError(res, 500, "provision_failed");
  }
});
router.all("/admin/provision", (_req, res) => res.status(405).json({ error: "method_not_allowed" }));

export default router;
