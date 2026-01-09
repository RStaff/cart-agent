/**
 * Success & Cancel pages for Stripe checkout
 *  - GET /success?session_id=... : thanks + trial info (if available)
 *  - GET /cancel                 : graceful “come back later” page
 * Idempotent, no external front-end deps. SSR only.
 */
export function installSuccess(app) {
  const SITE = process.env.APP_URL || "https://abando.ai";
  const support = process.env.SUPPORT_EMAIL || "support@abando.ai";

  function page({ title, body, extraHead = "" }) {
    return `<!doctype html><html lang="en">
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:880px;margin:0 auto;padding:40px 20px}
.card{background:#121214;border:1px solid #222;border-radius:16px;padding:22px}
h1{font-size:clamp(28px,5vw,42px);margin:.2rem 0 1rem}
.lead{opacity:.9;font-size:clamp(16px,2.2vw,19px);line-height:1.7}
.row{display:flex;flex-wrap:wrap;gap:16px;margin:14px 0}
.kv{flex:1 1 240px;background:#0f0f11;border:1px solid #222;border-radius:12px;padding:12px}
.kv b{display:block;opacity:.75;font-weight:600;margin-bottom:4px}
.cta{display:inline-block;padding:12px 16px;border-radius:12px;background:#5b8cff;color:#0b0b0c;font-weight:800;text-decoration:none}
.ghost{display:inline-block;padding:12px 16px;border-radius:12px;background:#0f0f11;border:1px solid #222;color:#f2f2f2;text-decoration:none}
.small{opacity:.65;font-size:12px;margin-top:10px}
footer{opacity:.6;font-size:13px;margin-top:20px}
</style>${extraHead}
<body><div class="wrap">` + body + `</div></body></html>`;
  }

  // Utility to format epoch seconds (trial_end) nicely
  function fmt(sec) {
    try {
      if (!sec) return "—";
      const d = new Date(Number(sec) * 1000);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch { return "—"; }
  }

  // GET /success
  app.get("/success", async (req, res) => {
    const sid = String(req.query.session_id || "");
    let details = { email: "", plan: "", trialEnd: "", amount: "", currency: "", live: false, ok: false, why: "" };

    if (sid && (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || process.env.STRIPE_API_KEY)) {
      try {
        const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || process.env.STRIPE_API_KEY;
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(key);
        const session = await stripe.checkout.sessions.retrieve(sid, { expand: ["subscription", "customer", "line_items.data.price.product"] });

        const sub = session.subscription || {};
        const item = sub.items?.data?.[0];
        const price = item?.price;
        const product = price?.product;

        details.ok = true;
        details.live = session.livemode || false;
        details.email = session.customer_details?.email || session.customer?.email || "";
        details.plan =
          (session.metadata && session.metadata.plan) ||
          price?.nickname ||
          product?.name ||
          price?.lookup_key ||
          "Your plan";
        details.trialEnd = fmt(sub.trial_end);
        details.amount = (price?.unit_amount != null) ? (price.unit_amount / 100).toFixed(2) : "";
        details.currency = (price?.currency || "").toUpperCase();
      } catch (e) {
        details.ok = false;
        details.why = String(e && e.message || e);
      }
    }

    const body = `
      <div class="card">
        <h1>You're in! 🎉</h1>
        <p class="lead">Thanks for starting your free trial of <strong>Abando</strong>. We just emailed your receipt and next steps${details.email ? ` to <strong>${details.email}</strong>` : ""}.</p>

        <div class="row">
          <div class="kv"><b>Plan</b><div>${details.plan || "Trial"}</div></div>
          <div class="kv"><b>Trial ends</b><div>${details.trialEnd || "In 14 days"}</div></div>
          <div class="kv"><b>Billing</b><div>${details.amount ? `${details.amount} ${details.currency}/mo` : "After trial"}</div></div>
        </div>

        <p style="margin-top:14px">
          <a class="cta" href="/install">Set up Abando</a>
          <a class="ghost" style="margin-left:8px" href="/">Back to site</a>
        </p>

        <p class="small">Need help? Email <a href="mailto:${support}">${support}</a>.</p>
        ${details.ok ? "" : (sid ? `<p class="small">Note: we couldn’t load Stripe details right now${details.why ? ` (${details.why})` : ""}. Your trial is still active.</p>` : "")}
      </div>
      <footer>© ${new Date().getFullYear()} Abando</footer>
    `;
    res.status(200).type("html").send(page({ title: "Welcome to Abando – Trial started", body }));
  });

  // GET /cancel
  app.get("/cancel", (_req, res) => {
    const body = `
      <div class="card">
        <h1>No worries 👋</h1>
        <p class="lead">We didn’t start your trial. If you ran into an issue, we’d love to help you get set up in minutes.</p>
        <p style="margin-top:14px">
          <a class="cta" href="/pricing">Try again</a>
          <a class="ghost" style="margin-left:8px" href="/">Back to site</a>
        </p>
        <p class="small">Questions? <a href="mailto:${support}">${support}</a></p>
      </div>
      <footer>© ${new Date().getFullYear()} Abando</footer>
    `;
    res.status(200).type("html").send(page({ title: "Checkout canceled", body }));
  });

  // Optional: simple /onboarding placeholder
  app.get("/onboarding", (_req, res) => {
    const body = `
      <div class="card">
        <h1>Let’s set you up</h1>
        <p class="lead">Connect your store, place the snippet, and turn on your first recovery play. This takes ~5 minutes.</p>
        <ol style="line-height:1.8; opacity:.9">
          <li>Paste the Abando snippet into your theme (or install the Shopify app).</li>
          <li>Pick a recovery playbook and turn it on.</li>
          <li>Watch the analytics for your first recovered cart.</li>
        </ol>
        <p style="margin-top:14px">
          <a class="cta" href="/">Go home</a>
          <a class="ghost" style="margin-left:8px" href="/pricing">Upgrade or manage plan</a>
        </p>
      </div>
      <footer>© ${new Date().getFullYear()} Abando</footer>
    `;
    res.status(200).type("html").send(page({ title: "Onboarding – Abando", body }));
  });
}
