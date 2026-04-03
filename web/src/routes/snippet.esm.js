import express from "express";
import { getStorefrontCheckoutDetectorScript } from "../lib/storefrontCheckoutDetector.js";
import { readDashboardMetrics, upsertSyntheticAbandonedCart } from "./internalTest.esm.js";
import { processOrdersPaidPayload } from "./orderWebhook.esm.js";

function isLocalValidationRequest(req) {
  const host = String(req.hostname || "").trim().toLowerCase();
  return host === "127.0.0.1" || host === "localhost";
}

function eventIngestBase() {
  const value =
    process.env.ABANDO_STOREFRONT_EVENT_BASE ||
    process.env.ABANDO_STOREFRONT_CAPTURE_BASE ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.ABANDO_PUBLIC_APP_ORIGIN ||
    process.env.NEXT_PUBLIC_ABANDO_PUBLIC_APP_ORIGIN ||
    "https://cart-agent-api.onrender.com";
  try {
    return new URL(String(value)).origin;
  } catch {
    return String(value).replace(/\/+$/, "");
  }
}

function parseValidationConfig(search = "") {
  const params = new URLSearchParams(search || "");
  return {
    shopDomain: String(params.get("shop") || "proof-store.myshopify.com").trim(),
    forcedDecision: String(params.get("abando_intercept") || "").trim() || "none",
    idleMs: String(params.get("abando_idle_ms") || "1200").trim() || "1200",
    cartValueCents: Math.max(0, Number(params.get("cart_value_cents") || 8900)),
    itemCount: Math.max(1, Number(params.get("item_count") || 2)),
  };
}

function buildDashboardDelta(before, after) {
  return {
    cartsTotal: Number(after?.cartsTotal || 0) - Number(before?.cartsTotal || 0),
    cartsRecovered: Number(after?.cartsRecovered || 0) - Number(before?.cartsRecovered || 0),
    emailsSent: Number(after?.emailsSent || 0) - Number(before?.emailsSent || 0),
  };
}

/**
 * Public snippet + install flow
 *  - GET /abando.js       : embeddable script (merchant drops this on their site)
 *  - POST /abando-ping    : CORS ping endpoint (telemetry light)
 *  - GET /install         : copy/paste instructions
 *  - GET /embed-test      : quick local verification page
 */
export function installSnippet(app) {
  function renderValidationPage(cartToken, config) {
    const { shopDomain, forcedDecision, idleMs, cartValueCents, itemCount } = config;
    const currentPath = `/checkouts/${encodeURIComponent(cartToken)}/information`;
    const basePath = `${currentPath}?abando_validation=1&abando_proof=1&shop=${encodeURIComponent(shopDomain)}&abando_idle_ms=${encodeURIComponent(idleMs)}&cart_value_cents=${encodeURIComponent(cartValueCents)}&item_count=${encodeURIComponent(itemCount)}`;
    const forceShow = `${basePath}&abando_intercept=show_intercept`;
    const forceLogOnly = `${basePath}&abando_intercept=log_only`;
    const forceNoAction = `${basePath}&abando_intercept=no_action`;
    const resetPath = `${basePath}&abando_reset_intercept=1`;
    const realSignalPath = `${basePath}&abando_intercept=none`;

    return `<!doctype html><html lang="en"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Abando Storefront Validation</title>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;background:#020617;color:#e2e8f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  .wrap{max-width:980px;margin:0 auto;padding:28px 20px 80px}
  .shell{border:1px solid rgba(71,85,105,.55);background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(2,6,23,.98));border-radius:24px;padding:26px;box-shadow:0 30px 80px rgba(2,6,23,.45)}
  .eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc;margin-bottom:12px}
  h1{font-size:clamp(28px,4vw,42px);line-height:1.05;margin:0 0 10px}
  p{color:#cbd5e1;line-height:1.6}
  .meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:18px}
  .card{border:1px solid rgba(71,85,105,.4);background:rgba(15,23,42,.65);border-radius:16px;padding:14px}
  .label{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:6px}
  .value{font-size:16px;font-weight:700}
  .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
  .btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:999px;text-decoration:none;font-weight:700;border:1px solid rgba(56,189,248,.24)}
  .btn.primary{background:#38bdf8;color:#082f49}
  .btn.secondary{color:#e2e8f0;background:rgba(15,23,42,.55)}
  .btn.button{cursor:pointer;font:inherit}
  .note{margin-top:18px;font-size:13px;color:#94a3b8}
  .proof{margin-top:20px;border:1px solid rgba(56,189,248,.18);background:rgba(2,6,23,.45);border-radius:18px;padding:18px}
  .proof h2{margin:0 0 12px;font-size:18px}
  .proof-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  .proof-item{border:1px solid rgba(71,85,105,.35);border-radius:14px;padding:12px;background:rgba(15,23,42,.5)}
  .proof-label{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:4px}
  .proof-value{font-size:14px;font-weight:700;word-break:break-word}
</style>
<body data-abando-validation-page="true">
  <div class="wrap">
    <div class="shell">
      <div class="eyebrow">Abando Local Validation</div>
      <h1>Real storefront recovery validation</h1>
      <p>Open this page in a real browser session. It uses the same <code>/abando.js</code> storefront runtime and a checkout-like path so the browser generates checkout-start and checkout-risk, then you can finish a local-safe order completion using the shared orders-paid handling path.</p>
      <div class="meta">
        <div class="card"><div class="label">Shop Domain</div><div class="value">${shopDomain}</div></div>
        <div class="card"><div class="label">Cart Token</div><div class="value">${cartToken}</div></div>
        <div class="card"><div class="label">Forced Decision</div><div class="value">${forcedDecision}</div></div>
        <div class="card"><div class="label">Idle Validation Window</div><div class="value">${idleMs}ms</div></div>
        <div class="card"><div class="label">Cart Value</div><div class="value">$${(Number(cartValueCents) / 100).toFixed(2)}</div></div>
        <div class="card"><div class="label">Item Count</div><div class="value">${itemCount}</div></div>
      </div>
      <div class="actions">
        <a class="btn primary" href="${realSignalPath}">Run real signal path</a>
        <a class="btn primary" href="${forceShow}">Force show_intercept</a>
        <a class="btn secondary" href="${forceLogOnly}">Force log_only</a>
        <a class="btn secondary" href="${forceNoAction}">Force no_action</a>
        <a class="btn secondary" href="${resetPath}">Reset session suppression</a>
        <button class="btn secondary button" type="button" id="completeOrderButton">Complete local test order</button>
      </div>
      <div class="note">Validation mode is local-only on this page. Use <strong>Run real signal path</strong> to keep the production signal chain intact while shortening idle timeout for local proof.</div>

      <section class="proof" id="proofPanel">
        <h2>Live proof output</h2>
        <div class="proof-grid">
          <div class="proof-item"><div class="proof-label">Artifact</div><div class="proof-value" id="artifactStatus">pending</div></div>
          <div class="proof-item"><div class="proof-label">Checkout Start Event</div><div class="proof-value" id="checkoutStartEventId">pending</div></div>
          <div class="proof-item"><div class="proof-label">Checkout Risk Event</div><div class="proof-value" id="checkoutRiskEventId">pending</div></div>
          <div class="proof-item"><div class="proof-label">Decision</div><div class="proof-value" id="decisionStatus">pending</div></div>
          <div class="proof-item"><div class="proof-label">Order Match</div><div class="proof-value" id="matchStatus">pending</div></div>
          <div class="proof-item"><div class="proof-label">Recovered</div><div class="proof-value" id="recoveredStatus">pending</div></div>
          <div class="proof-item"><div class="proof-label">Dashboard Delta</div><div class="proof-value" id="dashboardDelta">pending</div></div>
          <div class="proof-item"><div class="proof-label">Recovery Event</div><div class="proof-value" id="recoveryEventStatus">pending</div></div>
          <div class="proof-item"><div class="proof-label">Resolved Shop</div><div class="proof-value" id="proofShop">pending</div></div>
          <div class="proof-item"><div class="proof-label">Event Base</div><div class="proof-value" id="proofEventBase">pending</div></div>
          <div class="proof-item"><div class="proof-label">Last Event Attempt</div><div class="proof-value" id="proofLastEvent">pending</div></div>
          <div class="proof-item"><div class="proof-label">Post Status</div><div class="proof-value" id="proofPostStatus">pending</div></div>
        </div>
      </section>
    </div>
  </div>
  <script src="/abando.js" defer data-shop-domain="${shopDomain}" data-signal-base="" data-event-base="${eventIngestBase()}" data-validation-mode="local"></script>
  <script>
    (function(){
      var shopDomain = ${JSON.stringify(shopDomain)};
      var cartToken = ${JSON.stringify(cartToken)};
      var revenueCents = ${JSON.stringify(Number(cartValueCents))};
      var completeButton = document.getElementById('completeOrderButton');
      var artifactStatus = document.getElementById('artifactStatus');
      var checkoutStartEventId = document.getElementById('checkoutStartEventId');
      var checkoutRiskEventId = document.getElementById('checkoutRiskEventId');
      var decisionStatus = document.getElementById('decisionStatus');
      var matchStatus = document.getElementById('matchStatus');
      var recoveredStatus = document.getElementById('recoveredStatus');
      var dashboardDelta = document.getElementById('dashboardDelta');
      var recoveryEventStatus = document.getElementById('recoveryEventStatus');
      var proofShop = document.getElementById('proofShop');
      var proofEventBase = document.getElementById('proofEventBase');
      var proofLastEvent = document.getElementById('proofLastEvent');
      var proofPostStatus = document.getElementById('proofPostStatus');

      function syncProofState() {
        artifactStatus.textContent = document.body.getAttribute('data-abando-artifact') || 'pending';
        checkoutStartEventId.textContent = document.body.getAttribute('data-abando-checkout-start-event-id') || 'pending';
        checkoutRiskEventId.textContent = document.body.getAttribute('data-abando-checkout-risk-event-id') || 'pending';
        var decision = document.body.getAttribute('data-abando-checkout-risk-decision');
        var reason = document.body.getAttribute('data-abando-checkout-risk-reason');
        decisionStatus.textContent = decision ? decision + (reason ? ' · ' + reason : '') : 'pending';
        proofShop.textContent = document.body.getAttribute('data-abando-proof-shop') || 'pending';
        proofEventBase.textContent = document.body.getAttribute('data-abando-proof-event-base') || 'pending';
        proofLastEvent.textContent = document.body.getAttribute('data-abando-proof-last-event') || 'pending';
        proofPostStatus.textContent = document.body.getAttribute('data-abando-proof-post-status') || 'pending';
      }

      syncProofState();
      window.setInterval(syncProofState, 250);

      completeButton.addEventListener('click', async function() {
        completeButton.disabled = true;
        completeButton.textContent = 'Completing…';
        try {
          var response = await fetch('/api/dev/validation/complete-order', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              shopDomain: shopDomain,
              cartToken: cartToken,
              revenueCents: revenueCents
            })
          });
          var body = await response.json().catch(function(){ return {}; });
          if (!response.ok || !body.ok) {
            matchStatus.textContent = 'error';
            recoveredStatus.textContent = body.error || 'failed';
            return;
          }
          matchStatus.textContent = String(body.matched);
          recoveredStatus.textContent = String(body.recovered);
          var delta = body.dashboardDelta || {};
          dashboardDelta.textContent = 'recovered +' + String(delta.cartsRecovered || 0) + ', emails +' + String(delta.emailsSent || 0);
          recoveryEventStatus.textContent = body.recoveryEvent && body.recoveryEvent.id ? body.recoveryEvent.id : (body.recoveryPosted ? 'posted' : 'not-posted');
        } catch (error) {
          matchStatus.textContent = 'error';
          recoveredStatus.textContent = String(error && error.message || error || 'failed');
        } finally {
          completeButton.disabled = false;
          completeButton.textContent = 'Complete local test order';
        }
      });
    })();
  </script>
</body></html>`;
  }

  // ---------- /abando.js (embeddable) ----------
  app.get("/abando.js", (_req, res) => {
    const detectorScript = getStorefrontCheckoutDetectorScript();
    res.type("application/javascript").send(`(function(){
      if (window.__abandoLoaded) return; window.__abandoLoaded = true;
      var s=document.currentScript||(function(){var a=document.getElementsByTagName('script');return a[a.length-1]||null})();
      var cfg={
        position:(s&&s.getAttribute('data-position'))||'right',        // right|left
        accent:(s&&s.getAttribute('data-accent'))||'#5b8cff',
        label:(s&&s.getAttribute('data-label'))||'Ask Abando',
        demo:(s&&s.getAttribute('data-demo'))||'0'
      };
      function el(t,css,props){var e=document.createElement(t); if(css) for(var k in css) e.style[k]=css[k]; if(props) for(var k in props) e[k]=props[k]; return e;}
      var btn=el('button',{position:'fixed',zIndex:'2147483647',bottom:'18px',right:cfg.position==='right'?'18px':'auto',left:cfg.position==='left'?'18px':'auto',padding:'12px 16px',borderRadius:'999px',background:cfg.accent,color:'#0b0b0c',border:'0',fontWeight:'800',boxShadow:'0 6px 20px rgba(0,0,0,.35)',cursor:'pointer'},{innerText:cfg.label,ariaLabel:'Open Abando'});
      var overlay=el('div',{position:'fixed',inset:'0',display:'none',background:'rgba(0,0,0,.55)',backdropFilter:'blur(2px)',zIndex:'2147483646'});
      var modal=el('div',{position:'fixed',bottom:'78px',right:cfg.position==='right'?'18px':'auto',left:cfg.position==='left'?'18px':'auto',width:'min(420px,92vw)',height:'min(520px,78vh)',background:'#0b0b0c',color:'#f2f2f2',border:'1px solid #222',borderRadius:'14px',overflow:'hidden',boxShadow:'0 10px 30px rgba(0,0,0,.45)',display:'none',zIndex:'2147483647'});
      var bar=el('div',{height:'42px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 10px',background:'#121214',borderBottom:'1px solid #222'});
      var title=el('div',null,{innerText:'Abando'});
      var x=el('button',{background:'transparent',border:'0',color:'#f2f2f2',fontSize:'18px',cursor:'pointer',padding:'6px'},{innerText:'×',title:'Close'});
      var body=el('div',{padding:'12px',fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',lineHeight:'1.55'});
      var demoHTML='<div style="opacity:.9">Abando is active on this storefront. Ask about shipping, returns, or sizing and then continue checkout with confidence.</div><div style="margin-top:10px;opacity:.65;fontSize:12px">This is a lightweight preview. <a href="/demo" target="_blank" rel="noopener" style="color:'+cfg.accent+';text-decoration:none">See full demo ↗</a></div>';
      body.innerHTML=demoHTML;
      bar.appendChild(title); bar.appendChild(x); modal.appendChild(bar); modal.appendChild(body);
      function open(){overlay.style.display='block'; modal.style.display='block';}
      function close(){overlay.style.display='none'; modal.style.display='none';}
      btn.addEventListener('click',open); overlay.addEventListener('click',close); x.addEventListener('click',close);
      document.addEventListener('keydown',function(e){ if(e.key==='Escape') close();});
      document.addEventListener('DOMContentLoaded',function(){ document.body.appendChild(btn); document.body.appendChild(overlay); document.body.appendChild(modal); });
${detectorScript}
      // telemetry ping (best-effort)
      try{ fetch('https://abando.ai/abando-ping',{method:'POST',mode:'cors',headers:{'content-type':'application/json'},body:JSON.stringify({href:location.href,origin:location.origin,title:document.title,ua:navigator.userAgent,ts:Date.now()})}).catch(function(){});}catch(e){}
    })();`);
  });

  // ---------- /abando-ping (CORS) ----------
  const pings = [];
  app.options("/abando-ping", (_req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "content-type");
    res.set("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.status(204).end();
  });
  app.post("/abando-ping", (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    try {
      const { href, origin, title, ua } = req.body || {};
      pings.push({ ts: Date.now(), ip: (req.headers["x-forwarded-for"]||req.ip||"").toString(), origin, href, title, ua });
      if (pings.length > 200) pings.shift();
    } catch {}
    res.json({ ok: true });
  });

  // ---------- /install (copy/paste) ----------
  app.get("/install", (_req, res) => {
    const SNIP = `<script src="${eventIngestBase()}/abando.js" defer></script>`;
    res.status(200).type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Install Abando</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:880px;margin:0 auto;padding:40px 20px}
.card{background:#121214;border:1px solid #222;border-radius:16px;padding:22px}
h1{font-size:clamp(28px,5vw,42px);margin:.2rem 0 1rem}
.lead{opacity:.9;font-size:clamp(16px,2.2vw,19px);line-height:1.7}
pre{background:#0f0f11;border:1px solid #222;border-radius:12px;padding:12px;overflow:auto}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.kv{display:flex;gap:12px;margin:14px 0;flex-wrap:wrap}
.btn{display:inline-block;padding:12px 16px;border-radius:12px;background:#5b8cff;color:#0b0b0c;font-weight:800;text-decoration:none}
.ghost{display:inline-block;padding:12px 16px;border-radius:12px;background:#0f0f11;border:1px solid #222;color:#f2f2f2;text-decoration:none}
.small{opacity:.65;font-size:12px;margin-top:8px}
</style>
<body><div class="wrap">
  <div class="card">
    <h1>Install Abando</h1>
    <p class="lead">Copy this into your site's <strong>&lt;head&gt;</strong> (or theme header). That’s it. The Abando assistant appears on the storefront and opens the recovery experience.</p>
    <pre><code>${SNIP.replace(/</g,"&lt;")}</code></pre>
    <div class="kv">
      <a class="btn" href="/embed-test" target="_blank" rel="noopener">Open Test Page ↗</a>
      <a class="ghost" href="/">Back to site</a>
    </div>
    <p class="small">Options: <code>data-position="left|right"</code>, <code>data-accent="#5b8cff"</code>, <code>data-label="Ask Abando"</code></p>
  </div>
  <footer class="small" style="opacity:.6;margin-top:16px">© ${new Date().getFullYear()} Abando</footer>
</div></body></html>`);
  });

  // ---------- /embed-test (quick verification) ----------
  app.get("/embed-test", (_req, res) => {
    res.status(200).type("html").send(`<!doctype html><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Abando Assistant Test</title>
<style>body{background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;display:grid;place-items:center;height:100vh}</style>
<h1>Abando assistant test page</h1>
<script src="/abando.js" defer></script>`);
  });

  app.get("/checkouts/:cartToken/information", async (req, res) => {
    if (String(req.query.abando_validation || "") !== "1") {
      return res.status(404).type("html").send("<!doctype html><title>Not found</title><p>Not found.</p>");
    }

    if (!isLocalValidationRequest(req)) {
      return res.status(404).type("html").send("<!doctype html><title>Not found</title><p>Not found.</p>");
    }

    const cartToken = String(req.params?.cartToken || "validation-cart").trim() || "validation-cart";
    const config = parseValidationConfig(req.url.split("?")[1] || "");

    await upsertSyntheticAbandonedCart({
      shopDomain: config.shopDomain,
      cartToken,
      cartValueCents: config.cartValueCents,
      itemCount: config.itemCount,
      createdAt: new Date(),
      userEmail: "proof-buyer@example.com",
    });

    return res.status(200).type("html").send(renderValidationPage(cartToken, config));
  });

  app.post("/api/dev/validation/complete-order", express.json({ limit: "32kb" }), async (req, res) => {
    if (!isLocalValidationRequest(req)) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    const shopDomain = String(req.body?.shopDomain || "").trim();
    const cartToken = String(req.body?.cartToken || "").trim();
    const revenueCents = Math.max(0, Number(req.body?.revenueCents ?? 0));

    if (!shopDomain || !cartToken) {
      return res.status(400).json({ ok: false, error: "shopDomain and cartToken are required" });
    }

    const dashboardBefore = await readDashboardMetrics(shopDomain);
    const result = await processOrdersPaidPayload({
      id: req.body?.orderId || `validation-order-${Date.now()}`,
      cart_token: cartToken,
      checkout_token: req.body?.checkoutToken || `validation-checkout-${Date.now()}`,
      total_price: (revenueCents / 100).toFixed(2),
      currency: req.body?.currency || "USD",
      email: req.body?.customerEmail || "proof-buyer@example.com",
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      synthetic: true,
    }, {
      shopDomain,
      synthetic: true,
    });

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error || "order_processing_failed" });
    }

    const dashboardAfter = await readDashboardMetrics(shopDomain);
    return res.status(200).json({
      ok: true,
      pathUsed: "shared_orders_paid_handler",
      matched: Boolean(result.matched),
      recovered: String(result.cartStatus || "").toLowerCase() === "recovered",
      recoveryPosted: Boolean(result.recoveryPost?.ok),
      recoveryEvent: result.recoveryPost?.body?.recoveryEvent || null,
      orderId: result.simulatedPayload?.orderId || req.body?.orderId || null,
      cartId: result.cartId || cartToken,
      dashboardBefore,
      dashboardAfter,
      dashboardDelta: buildDashboardDelta(dashboardBefore, dashboardAfter),
    });
  });
}
