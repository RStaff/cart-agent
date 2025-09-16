export default function pricingPage(_req, res) {
  res.status(200).type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Pricing – Abando</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background:#0b0b0c; color:#f2f2f2; }
    .wrap { max-width: 860px; margin: 64px auto; padding: 0 20px; }
    h1 { font-size: clamp(28px,4vw,44px); margin: 0 0 8px; }
    p  { opacity:.9; line-height:1.6; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: 20px; margin-top: 24px; }
    .card { background:#121214; border:1px solid #222; border-radius:14px; padding:20px; }
    .price { font-size: 28px; margin:.5rem 0 1rem; }
    ul { opacity:.9; margin: 0 0 1rem 1.25rem; }
    button { width:100%; border:0; padding:12px 16px; border-radius:10px; font-weight:700; cursor:pointer; }
    .primary { background:#5b8cff; color:#0b0b0c; }
    .secondary { background:#23d18b; color:#0b0b0c; }
    .foot { margin-top:1.25rem; font-size:14px; opacity:.65 }
    .err { margin-top:1rem; color:#ff6b6b; min-height:1.2em; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Choose your plan</h1>
    <p><strong>Abando pays for itself after a single recovered cart.</strong> 14-day free trial. Cancel anytime.</p>
    <div id="msg" class="err"></div>

    <div class="grid">
      <div class="card">
        <h3>Starter</h3>
        <div class="price">$59.99<span style="opacity:.65;font-size:16px"> /mo</span></div>
        <ul>
          <li>Core conversion agent</li>
          <li>Email support</li>
        </ul>
        <button class="primary" onclick="go('starter')">Start Free Trial</button>
      </div>

      <div class="card">
        <h3>Pro</h3>
        <div class="price">$149.99<span style="opacity:.65;font-size:16px"> /mo</span></div>
        <ul>
          <li>All Starter features</li>
          <li>Advanced playbooks & integrations</li>
          <li>Priority support</li>
        </ul>
        <button class="secondary" onclick="go('pro')">Start Free Trial</button>
      </div>
    </div>

    <div class="foot">Questions? <a href="https://abando.ai" style="color:#8ab4ff">Visit our site</a>.</div>
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
</body>
</html>`);
}
