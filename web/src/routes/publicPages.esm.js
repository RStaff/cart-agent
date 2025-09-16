/**
 * Lightweight public pages for checkout: /buy, /success, /cancel
 * Also exposes /__public-checkout/_status for quick probes.
 */
export function installPublicPages(app) {
  const APP_URL = process.env.APP_URL || "https://abando.ai";

  // Health / status for quick verification
  app.get("/__public-checkout/_status", (_req, res) => {
    const key = process.env.STRIPE_SECRET_KEY || "";
    res.json({
      ok: true,
      live: key.startsWith("sk_live_"),
      hasPrices: {
        starter: !!process.env.PRICE_STARTER,
        pro: !!process.env.PRICE_PRO,
        scale: !!process.env.PRICE_SCALE,
      },
      successUrl: process.env.CHECKOUT_SUCCESS_URL || null,
      cancelUrl: process.env.CHECKOUT_CANCEL_URL || null,
    });
  });

  // Simple buy page (Starter / Pro). Posts to /__public-checkout then redirects.
  app.get("/buy", (_req, res) => {
    const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Abando — Choose your plan</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background: #0b0b0c; color:#f2f2f2;}
  .wrap { max-width: 760px; margin: 6rem auto; padding: 0 1.25rem; }
  h1 { font-size: clamp(28px, 4vw, 44px); margin: 0 0 1rem; }
  p  { opacity:.85; line-height:1.5; }
  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 20px; margin-top: 2rem; }
  .card { background:#121214; border:1px solid #222; border-radius: 14px; padding: 20px; }
  .price { font-size: 28px; margin: .5rem 0 1rem; }
  button { width: 100%; border:0; padding: 12px 16px; border-radius:10px; font-weight: 600; cursor:pointer; }
  .primary { background:#5b8cff; color:#0b0b0c; }
  .secondary { background:#23d18b; color:#0b0b0c; }
  .foot { margin-top:2rem; font-size:14px; opacity:.7 }
  .err { margin-top:1rem; color:#ff6b6b; min-height:1.2em; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Start with Abando</h1>
    <p>Pick a plan. You’ll be taken to a secure Stripe Checkout to complete your purchase.</p>
    <div id="msg" class="err"></div>
    <div class="grid">
      <div class="card">
        <h3>Starter</h3>
        <div class="price">$59.99<span style="opacity:.65;font-size:16px"> /mo</span></div>
        <ul style="opacity:.85; margin: 0 0 1rem 1rem;">
          <li>Core conversion agent</li>
          <li>Email support</li>
        </ul>
        <button class="primary" onclick="go('starter')">Buy Starter</button>
      </div>
      <div class="card">
        <h3>Pro</h3>
        <div class="price">$149.99<span style="opacity:.65;font-size:16px"> /mo</span></div>
        <ul style="opacity:.85; margin: 0 0 1rem 1rem;">
          <li>All Starter features</li>
          <li>Advanced playbooks & integrations</li>
          <li>Priority support</li>
        </ul>
        <button class="secondary" onclick="go('pro')">Buy Pro</button>
      </div>
    </div>
    <div class="foot">Questions? <a href="${APP_URL}" style="color:#8ab4ff">Visit our site</a>.</div>
  </div>
<script>
async function go(plan){
  const el = document.getElementById('msg'); el.textContent = '';
  try {
    const r = await fetch('/__public-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    const j = await r.json();
    if (j && j.ok && j.url) {
      window.location.href = j.url;
    } else {
      el.textContent = (j && (j.message || j.code)) || 'Checkout unavailable.';
    }
  } catch (e) {
    el.textContent = String(e && e.message || e);
  }
}
</script>
</body></html>`;
    res.status(200).type("html").send(html);
  });

  // Fallback success/cancel pages (nice to have even if your env points to abando.ai)
  app.get(["/success", "/__public-checkout/success"], (req, res) => {
    const sid = req.query.session_id || "";
    const html = `<!doctype html><meta charset="utf-8" />
<title>Thanks — Abando</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<div style="font-family:system-ui;padding:40px;max-width:720px;margin:40px auto;">
  <h1>Payment received 🎉</h1>
  <p>Thanks for your purchase. Your session id:<br><code>${sid}</code></p>
  <p><a href="${APP_URL}">Back to site</a></p>
</div>`;
    res.status(200).type("html").send(html);
  });

  app.get(["/cancel", "/__public-checkout/cancel"], (_req, res) => {
    const html = `<!doctype html><meta charset="utf-8" />
<title>Checkout canceled — Abando</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<div style="font-family:system-ui;padding:40px;max-width:720px;margin:40px auto;">
  <h1>Checkout canceled</h1>
  <p>No charge was made. You can restart anytime.</p>
  <p><a href="/buy">Back to plans</a></p>
</div>`;
    res.status(200).type("html").send(html);
  });
}
