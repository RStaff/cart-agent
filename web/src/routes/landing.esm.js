/**
 * installLanding(app): "/" homepage
 * - Minimal, fast, server-rendered HTML
 * - Big hero, social proof, feature bullets, CTA to /pricing
 * - Includes floating demo widget button (/demo/embed.js)
 */
export function installLanding(app){
  app.get("/", (_req,res)=>{
    const title = "Abando — turn abandoned carts into revenue";
    const year = new Date().getFullYear();
    res.status(200).type("html").send(`<!doctype html><html lang="en">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<meta name="description" content="A checkout co-pilot that answers questions, guides, and closes—so abandoned carts become orders."/>
<link rel="icon" href="data:;base64,iVBORw0KGgo="/>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif}
a{color:inherit}
.hero{max-width:1100px;margin:0 auto;padding:60px 20px 30px;display:flex;flex-wrap:wrap;gap:24px;align-items:center}
.h-left{flex:1 1 520px}
.badge{display:inline-flex;gap:8px;align-items:center;padding:6px 10px;border:1px solid #222;border-radius:999px;background:#121214;font-size:12px;opacity:.9}
h1{font-size:clamp(32px,6.5vw,56px);line-height:1.05;margin:14px 0 10px}
.lead{opacity:.9;font-size:clamp(16px,2.2vw,20px);line-height:1.6;max-width:48ch}
.ctas{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
.btn{display:inline-block;padding:12px 16px;border-radius:12px;font-weight:800;text-decoration:none}
.btn.primary{background:#5b8cff;color:#0b0b0c}
.btn.ghost{border:1px solid #222;background:#121214}
.h-right{flex:1 1 420px}
.card{background:#121214;border:1px solid #222;border-radius:16px;padding:14px}
.mock{border-radius:12px;border:1px dashed #2a2a2e;padding:14px;opacity:.95}
.grid{max-width:1100px;margin:0 auto;padding:10px 20px 40px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.kv{background:#121214;border:1px solid #222;border-radius:12px;padding:14px}
.kv b{display:block;opacity:.75;margin-bottom:6px}
.footer{max-width:1100px;margin:0 auto;padding:20px;color:#aaa;font-size:13px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;border-top:1px solid #18181a}
.logo{font-weight:900;letter-spacing:.3px}
small.mono{font-family:ui-monospace, SFMono-Regular, Menlo, monospace;opacity:.8}
</style>
<body>
  <header class="hero">
    <div class="h-left">
      <div class="badge">✨ New • 14-day free trial</div>
      <h1>Recover more checkouts with an AI cart co-pilot</h1>
      <p class="lead">Abando answers questions, handles objections, and guides buyers through checkout—so <em>abandonment</em> turns into <strong>orders</strong>.</p>
      <div class="ctas">
        <a class="btn primary" href="/pricing">Start Free Trial</a>
        <a class="btn ghost" href="/demo">See a quick demo</a>
      </div>
      <p style="opacity:.7;margin-top:10px">Pays for itself after a single recovered cart.</p>
    </div>
    <div class="h-right">
      <div class="card mock">
        <div style="font-weight:700;margin-bottom:8px">Live preview</div>
        <div class="card" style="background:#0e0e10">
          <div style="display:flex;gap:8px;margin-bottom:8px"><div style="width:8px;height:8px;border-radius:999px;background:#2a2a2e"></div><div style="width:8px;height:8px;border-radius:999px;background:#2a2a2e"></div><div style="width:8px;height:8px;border-radius:999px;background:#2a2a2e"></div></div>
          <div style="display:flex;gap:10px;margin:6px 0">
            <div style="background:#1a1a1c;border:1px solid #2a2a2e;border-radius:12px;padding:10px 12px;max-width:80%">👋 Hey there! I can answer questions and guide you to checkout.</div>
          </div>
          <div style="display:flex;gap:10px;margin:6px 0;justify-content:flex-end">
            <div style="background:#23d18b;color:#002a15;border-radius:12px;padding:10px 12px;max-width:80%;font-weight:700">Do you have free returns?</div>
          </div>
          <div style="display:flex;gap:10px;margin:6px 0">
            <div style="background:#1a1a1c;border:1px solid #2a2a2e;border-radius:12px;padding:10px 12px;max-width:80%">Yes—30 days, no questions asked. Ready to checkout?</div>
          </div>
        </div>
        <p style="opacity:.65;font-size:12px;margin-top:8px">This is a lightweight preview. Click “See a quick demo.”</p>
      </div>
    </div>
  </header>

  <section class="grid">
    <div class="kv"><b>Answers that convert</b><div>Shipping, sizing, returns—instantly handled, on-brand.</div></div>
    <div class="kv"><b>Guided checkout</b><div>Collects what’s needed and hands off to Stripe/Shopify.</div></div>
    <div class="kv"><b>Playbooks</b><div>Proven objection-handling flows you can toggle on/off.</div></div>
    <div class="kv"><b>Analytics</b><div>See recovered carts and the moments that mattered.</div></div>
  </section>

  <footer class="footer">
    <div><span class="logo">Abando</span> · © ${year}</div>
    <div><a href="/pricing">Pricing</a> · <a href="/onboarding">Onboarding</a> · <a href="mailto:support@abando.ai">Support</a></div>
  </footer>

  <!-- floating demo pill -->
  <script src="/demo/embed.js" defer></script>
</body>
</html>`);
  });
}
